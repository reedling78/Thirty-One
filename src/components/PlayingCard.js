import React from "react";
import styled from "styled-components";

import Hearts2 from "./../svg/poker-1.svg";
import Spades2 from "./../svg/poker-2.svg";
import Clubs2 from "./../svg/poker-3.svg";
import Hearts5 from "./../svg/poker-4.svg";
import Spades5 from "./../svg/poker-5.svg";
import Diamonds2 from "./../svg/poker-6.svg";
import Hearts10 from "./../svg/poker-7.svg";
import Spades10 from "./../svg/poker-8.svg";
import Clubs3 from "./../svg/poker-9.svg";
import Diamonds3 from "./../svg/poker-10.svg";
import Hearts3 from "./../svg/poker-11.svg";
import Spades3 from "./../svg/poker-12.svg";
import Clubs4 from "./../svg/poker-13.svg";
import Diamonds4 from "./../svg/poker-14.svg";
import Hearts4 from "./../svg/poker-15.svg";
import Spades4 from "./../svg/poker-16.svg";
import Clubs5 from "./../svg/poker-17.svg";
import Diamonds5 from "./../svg/poker-18.svg";
import Diamonds6 from "./../svg/poker-19.svg";
import Clubs6 from "./../svg/poker-20.svg";
import Spades6 from "./../svg/poker-21.svg";
import Hearts6 from "./../svg/poker-22.svg";
import Hearts7 from "./../svg/poker-23.svg";
import Spades7 from "./../svg/poker-24.svg";
import Clubs7 from "./../svg/poker-25.svg";
import Diamonds7 from "./../svg/poker-26.svg";
import Clubs8 from "./../svg/poker-27.svg";
import Diamonds8 from "./../svg/poker-28.svg";
import Hearts8 from "./../svg/poker-29.svg";
import Spades8 from "./../svg/poker-30.svg";
import Clubs9 from "./../svg/poker-31.svg";
import Diamonds9 from "./../svg/poker-32.svg";
import Hearts9 from "./../svg/poker-33.svg";
import Spades9 from "./../svg/poker-34.svg";
import Diamonds10 from "./../svg/poker-35.svg";
import Clubs10 from "./../svg/poker-36.svg";
import HeartsJ from "./../svg/poker-37.svg";
import SpadesJ from "./../svg/poker-38.svg";
import ClubsJ from "./../svg/poker-39.svg";
import DiamondsJ from "./../svg/poker-40.svg";
import HeartsQ from "./../svg/poker-41.svg";
import SpadesQ from "./../svg/poker-42.svg";
import ClubsQ from "./../svg/poker-43.svg";
import DiamondsQ from "./../svg/poker-44.svg";
import ClubsK from "./../svg/poker-45.svg";
import DiamondsK from "./../svg/poker-46.svg";
import HeartsK from "./../svg/poker-47.svg";
import SpadesK from "./../svg/poker-48.svg";
import ClubsA from "./../svg/poker-49.svg";
import DiamondsA from "./../svg/poker-50.svg";
import HeartsA from "./../svg/poker-51.svg";
import SpadesA from "./../svg/poker-52.svg";
import Back from "./../svg/poker-53.svg";
import ClubsAA from "./../svg/poker-54.svg";

const PlayingCard = ({ className, children, cardId }) => {
  switch (cardId) {
    case "Back":
      return <img src={Back} className={className} alt="Back" />;
    case "DiamondsK":
      return <img src={DiamondsK} className={className} alt="DiamondsK" />;
    case "DiamondsQ":
      return <img src={DiamondsQ} className={className} alt="DiamondsQ" />;
    case "DiamondsJ":
      return <img src={DiamondsJ} className={className} alt="DiamondsJ" />;
    case "Diamonds10":
      return <img src={Diamonds10} className={className} alt="Diamonds10" />;
    case "Diamonds9":
      return <img src={Diamonds9} className={className} alt="Diamonds9" />;
    case "Diamonds8":
      return <img src={Diamonds8} className={className} alt="Diamonds8" />;
    case "Diamonds7":
      return <img src={Diamonds7} className={className} alt="Diamonds7" />;
    case "Diamonds6":
      return <img src={Diamonds6} className={className} alt="Diamonds6" />;
    case "Diamonds5":
      return <img src={Diamonds5} className={className} alt="Diamonds5" />;
    case "Diamonds4":
      return <img src={Diamonds4} className={className} alt="Diamonds4" />;
    case "Diamonds3":
      return <img src={Diamonds3} className={className} alt="Diamonds3" />;
    case "Diamonds2":
      return <img src={Diamonds2} className={className} alt="Diamonds2" />;
    case "DiamondsA":
      return <img src={DiamondsA} className={className} alt="DiamondsA" />;
    case "HeartsK":
      return <img src={HeartsK} className={className} alt="HeartsK" />;
    case "HeartsQ":
      return <img src={HeartsQ} className={className} alt="HeartsQ" />;
    case "HeartsJ":
      return <img src={HeartsJ} className={className} alt="HeartsJ" />;
    case "Hearts10":
      return <img src={Hearts10} className={className} alt="Hearts10" />;
    case "Hearts9":
      return <img src={Hearts9} className={className} alt="Hearts9" />;
    case "Hearts8":
      return <img src={Hearts8} className={className} alt="Hearts8" />;
    case "Hearts7":
      return <img src={Hearts7} className={className} alt="Hearts7" />;
    case "Hearts6":
      return <img src={Hearts6} className={className} alt="Hearts6" />;
    case "Hearts5":
      return <img src={Hearts5} className={className} alt="Hearts5" />;
    case "Hearts4":
      return <img src={Hearts4} className={className} alt="Hearts4" />;
    case "Hearts3":
      return <img src={Hearts3} className={className} alt="Hearts3" />;
    case "Hearts2":
      return <img src={Hearts2} className={className} alt="Hearts2" />;
    case "HeartsA":
      return <img src={HeartsA} className={className} alt="HeartsA" />;
    case "ClubsAA":
      return <img src={ClubsAA} className={className} alt="ClubsAA" />;
    case "ClubsK":
      return <img src={ClubsK} className={className} alt="ClubsK" />;
    case "ClubsQ":
      return <img src={ClubsQ} className={className} alt="ClubsQ" />;
    case "ClubsJ":
      return <img src={ClubsJ} className={className} alt="ClubsJ" />;
    case "Clubs10":
      return <img src={Clubs10} className={className} alt="Clubs10" />;
    case "Clubs9":
      return <img src={Clubs9} className={className} alt="Clubs9" />;
    case "Clubs8":
      return <img src={Clubs8} className={className} alt="Clubs8" />;
    case "Clubs7":
      return <img src={Clubs7} className={className} alt="Clubs7" />;
    case "Clubs6":
      return <img src={Clubs6} className={className} alt="Clubs6" />;
    case "Clubs5":
      return <img src={Clubs5} className={className} alt="Clubs5" />;
    case "Clubs4":
      return <img src={Clubs4} className={className} alt="Clubs4" />;
    case "Clubs3":
      return <img src={Clubs3} className={className} alt="Clubs3" />;
    case "Clubs2":
      return <img src={Clubs2} className={className} alt="Clubs2" />;
    case "ClubsA":
      return <img src={ClubsA} className={className} alt="ClubsA" />;
    case "SpadesK":
      return <img src={SpadesK} className={className} alt="SpadesK" />;
    case "SpadesQ":
      return <img src={SpadesQ} className={className} alt="SpadesQ" />;
    case "SpadesJ":
      return <img src={SpadesJ} className={className} alt="SpadesJ" />;
    case "Spades10":
      return <img src={Spades10} className={className} alt="Spades10" />;
    case "Spades9":
      return <img src={Spades9} className={className} alt="Spades9" />;
    case "Spades8":
      return <img src={Spades8} className={className} alt="Spades8" />;
    case "Spades7":
      return <img src={Spades7} className={className} alt="Spades7" />;
    case "Spades6":
      return <img src={Spades6} className={className} alt="Spades6" />;
    case "Spades5":
      return <img src={Spades5} className={className} alt="Spades5" />;
    case "Spades4":
      return <img src={Spades4} className={className} alt="Spades4" />;
    case "Spades3":
      return <img src={Spades3} className={className} alt="Spades3" />;
    case "Spades2":
      return <img src={Spades2} className={className} alt="Spades2" />;
    case "SpadesA":
      return <img src={SpadesA} className={className} alt="SpadesA" />;
    default:
      return <img src={Back} className={className} alt="Back" />;
  }
};

const PlayingCardStyled = styled(PlayingCard)`

`;

export default PlayingCardStyled;
