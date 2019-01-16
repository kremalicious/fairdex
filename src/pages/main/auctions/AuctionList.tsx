import React from 'react';
import { Flipped, Flipper } from 'react-flip-toolkit';
import styled from 'styled-components';

import Card from '../../../components/Card';
import Spinner from '../../../components/Spinner';
import * as images from '../../../images';
import AuctionView from './AuctionView';

export interface AuctionListProps {
  auctions: Auction[];
  isLoading?: boolean;
}

const AuctionList = ({ auctions, isLoading }: AuctionListProps) => (
  <Flipper flipKey={auctions.map(({ auctionIndex }) => auctionIndex).join('-')}>
    {isLoading ? (
      <EmptyList>
        <Spinner size='large' />
      </EmptyList>
    ) : auctions.length > 0 ? (
      <Container>
        {auctions.map(auction => {
          const key = `${auction.sellTokenAddress}-${auction.buyTokenAddress}-${auction.auctionIndex}`;

          return (
            <Flipped key={key} flipId={key}>
              <Item>
                <AuctionView data={auction} />
              </Item>
            </Flipped>
          );
        })}
      </Container>
    ) : (
      <EmptyList>
        <img src={images.auctions.EmptyList} />
        <h3>No auctions found</h3>
      </EmptyList>
    )}
  </Flipper>
);

AuctionList.defaultProps = {
  auctions: [],
  loading: false,
};

const Container = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(var(--card-width), 1fr));
  grid-gap: var(--spacing-normal);

  ${Card} {
    display: flex;
    flex-direction: column;

    & > *:last-child {
      flex: 1;
    }
  }
`;

const Item = styled.div`
  ${Card} {
    height: 100%;
  }
`;

const EmptyList = styled.div`
  position: relative;
  width: 100%;
  height: calc(100vh - var(--header-height) - var(--spacing-normal) * 2);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  user-select: none;

  img {
    width: 48px;
    height: 48px;
  }

  h3 {
    padding: var(--spacing-text) 0;
    font-size: 14px;
    font-weight: bold;
    text-transform: uppercase;
    line-height: 2.14;
    letter-spacing: -0.4px;
    text-align: center;
    color: var(--color-grey);
  }
`;

export default React.memo(AuctionList);
