import React from "react";
import styled from "styled-components";

const SectionHeader = ({ className, children }) => (
  <div className={className}>
    <h3>{children}</h3>
  </div>
);

const SectionHeaderStyled = styled(SectionHeader)`
  color: #fff;
  padding: 10px;
  text-align: center;
  margin-top: 50px;
`;

export default SectionHeaderStyled;
