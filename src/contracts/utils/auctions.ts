import { addHours, isAfter } from 'date-fns';

import { formatNumber, fromDecimal, toBigNumber, toDecimal, ZERO } from './decimal';

const AUCTION_DURATION = 6; // 6 hours
const AUCTION_ABOVE_PRIOR_PRICE_THRESHOLD = 1.1; // 10% above prior price

export async function getAuctionInfo(sellToken: Token, buyToken: Token, auctionIndex: string) {
  const [auctionStart, sellVolume = ZERO, buyVolume = ZERO, extraTokens = ZERO] = await Promise.all([
    dx.getAuctionStart(sellToken, buyToken),
    dx.getSellVolume(sellToken, buyToken),
    dx.getBuyVolume(sellToken, buyToken),
    dx.getExtraTokens(sellToken, buyToken, auctionIndex),
  ]);

  if (auctionStart) {
    const data: AuctionData = {
      auctionIndex,
      sellToken: sellToken.symbol,
      sellTokenDecimals: sellToken.decimals,
      sellTokenAddress: sellToken.address,
      sellVolume,
      extraTokens,
      buyToken: buyToken.symbol,
      buyTokenDecimals: buyToken.decimals,
      buyTokenAddress: buyToken.address,
      buyVolume,
    };

    const [currentPrice, closingPrice] = await Promise.all([
      dx.getCurrentPrice(sellToken, buyToken, auctionIndex),
      dx.getClosingPrice(sellToken, buyToken, auctionIndex),
    ]);

    const isClosed =
      (sellVolume && (!sellVolume.isFinite() || sellVolume.isZero())) ||
      (closingPrice && closingPrice.value.isFinite());

    const isTheoreticalClosed =
      currentPrice &&
      toBigNumber(currentPrice.numerator)
        .times(sellVolume || ZERO)
        .minus(toBigNumber(currentPrice.denominator).times(buyVolume || ZERO))
        .isZero();

    if (isClosed || isTheoreticalClosed) {
      const [endedAuctionStart, auctionEnd, bidVolume = ZERO] = await Promise.all([
        dx.getEndedAuctionStart(sellToken, buyToken, auctionIndex),
        dx.getAuctionEnd(sellToken, buyToken, auctionIndex),
        dx.getBuyVolume(sellToken, buyToken, auctionIndex),
      ]);

      if (auctionEnd && bidVolume.isPositive()) {
        const auction: EndedAuction = {
          ...data,
          state: 'ended',
          auctionStart: endedAuctionStart,
          auctionEnd,
          buyVolume: bidVolume,
          closingPrice,
        };

        return auction;
      }
    } else {
      const previousClosingPrice = await dx.getPreviousClosingPrice(sellToken, buyToken, auctionIndex);

      if (auctionStart > Date.now()) {
        const auction: ScheduledAuction = {
          ...data,
          state: 'scheduled',
          auctionStart,
          closingPrice: previousClosingPrice,
        };

        return auction;
      }

      if (currentPrice) {
        const auction: RunningAuction = {
          ...data,
          state: 'running',
          auctionStart,
          currentPrice,
          closingPrice: previousClosingPrice,
        };

        return auction;
      }
    }
  }
}

export async function getUnclaimedFunds(
  sellToken: Token,
  buyToken: Token,
  auctionIndex: string,
  currentAccount: Address,
) {
  const unclaimedFunds = dx.getUnclaimedFunds(sellToken, buyToken, auctionIndex, currentAccount);

  return unclaimedFunds;
}

export function getAvailableVolume(auction: RunningAuction) {
  if (auction.sellVolume && auction.sellVolume.gt(0)) {
    if (auction.buyVolume && auction.buyVolume.gte(0)) {
      if (auction.currentPrice.value && auction.currentPrice.value.gte(0)) {
        const sellVolumeDec = toBigNumber(fromDecimal(auction.sellVolume, auction.sellTokenDecimals));
        const buyVolumeDec = toBigNumber(fromDecimal(auction.buyVolume, auction.buyTokenDecimals));

        return toDecimal(
          sellVolumeDec
            .times(auction.currentPrice.numerator)
            .div(auction.currentPrice.denominator)
            .minus(buyVolumeDec),
          auction.buyTokenDecimals,
        );
      }
    }
  }

  return ZERO;
}

export function getEstimatedEndTime(auction: RunningAuction) {
  if (auction.auctionStart) {
    const estimatedEndTime = addHours(auction.auctionStart, AUCTION_DURATION);

    return estimatedEndTime;
  }

  return undefined;
}

export function isAbovePriorClosingPrice(auction: Auction) {
  if (
    auction.state !== 'running' ||
    auction.currentPrice.value == null ||
    auction.currentPrice.value == null
  ) {
    return false;
  }

  return auction.currentPrice.value.isGreaterThan(
    auction.closingPrice.value.times(AUCTION_ABOVE_PRIOR_PRICE_THRESHOLD),
  );
}

export function getSellVolumeInEth(auction: Auction, tokens: Map<Address, Token>) {
  const sellToken = tokens.get(auction.sellTokenAddress);

  if (
    auction.sellVolume &&
    auction.sellVolume.gt(0) &&
    sellToken &&
    sellToken.priceEth &&
    sellToken.priceEth.gt(0)
  ) {
    return auction.sellVolume.times(sellToken.priceEth);
  }

  return ZERO;
}

export function getPriceRate(value: BigNumber, sellToken: string, buyToken: string, decimals = 6) {
  if (!value || !value.isFinite() || value.lte(0)) {
    return '';
  }

  const formatted = formatNumber(value, { decimals });
  const formattedInverse = formatNumber(value.pow(-1), { decimals });

  return `1 ${sellToken} = ${formatted} ${buyToken}\n` + `1 ${buyToken} = ${formattedInverse} ${sellToken}`;
}

export function getCurrentPriceRate(auction: RunningAuction, decimals?: number) {
  return getPriceRate(auction.currentPrice.value, auction.sellToken, auction.buyToken, decimals);
}

export function getClosingPriceRate(auction: Auction, decimals?: number) {
  return getPriceRate(auction.closingPrice.value, auction.sellToken, auction.buyToken, decimals);
}

export function getCounterCurrencyPrice(value: BigNumber) {
  if (!value || !value.isFinite()) {
    return value;
  }

  return value.pow(-1);
}

export async function getBuyerBalance(
  sellToken: Token,
  buyToken: Token,
  auctionIndex: string,
  currentAccount: Address,
) {
  const buyerBalance = dx.getBuyerBalance(sellToken, buyToken, auctionIndex, currentAccount);

  return buyerBalance;
}

export function getTotalClaimFound(auction: Auction) {
  if (auction.closingPrice == null || auction.buyerBalance == null) {
    return ZERO;
  }

  return auction.buyerBalance.dividedBy(auction.closingPrice.value);
}
