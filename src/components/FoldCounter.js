import React from "react";
import styled from "styled-components";

import Dollar from "./../svg/Dollar.svg";

const FoldCounter = ({ className, children }) => (
  <div className={className}>
    <img src={Dollar} />
    <img src={Dollar} />
    <img src={Dollar} />
    <img src={Dollar} />
  </div>
);

const FoldCounterStyled = styled(FoldCounter)`
  
  img {
    height: 20px;
  }
`;

export default FoldCounterStyled;
