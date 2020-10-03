import React from "react";
import styled from "styled-components";
import PlayingCard from "./../components/PlayingCard";
import FoldCounter from "./../components/FoldCounter";

const Gameboard = ({ className, children }) => {
  return (
    <div className={className}>
      <Hand>
        <Card href="#">
          <PlayingCard cardId={"ClubsA"} />
        </Card>
        <Card href="#">
          <PlayingCard cardId={"Spades6"} />
        </Card>
        <Card href="#">
          <PlayingCard cardId={"Hearts5"} />
        </Card>
      </Hand>
      <Table>
        <Deck>
          <PlayingCard cardId={"Back"} />
        </Deck>
        <Discard>
          <PlayingCard cardId={"Hearts9"} />
        </Discard>
      </Table>
      <Players>
        <Player>Jeff<FoldCounter /></Player>
        <Player>Jimmy<FoldCounter /></Player>
        <Player>Dave<FoldCounter /></Player>
        <Player>Rob<FoldCounter /></Player>
      </Players>
    </div>
  );
};

const GameboardStyled = styled(Gameboard)`

`;

const Hand = styled.div`
  display: flex;
  justify-content: space-evenly;
  align-content: center;
  align-items: center;
`;

const Card = styled.div`
  flex:1;
`;

const Table = styled.div`
  display: flex;
  justify-content: center;
  margin: 10px 50px;
`;

const Deck = styled.div`
  flex:1;
`;

const Discard = styled.div`
  flex:1;
`;

const Players = styled.ul`
  /* border-top: dotted 1px #000; */
`;

const Player = styled.li`
  padding: 5px;
  background-color: red;
  font-size: 30px;
  border-bottom: dotted 1px #000;
`;

export default GameboardStyled;
