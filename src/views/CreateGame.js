import React from "react";
import styled from "styled-components";
import { NavLink } from "react-router-dom";
import { useForm } from "react-hook-form";

import {
  Form,
  FieldWrapper,
  Label,
  TextFields,
  ErrorText,
  ButtonWrapper,
  Button,
} from "./../components/Form";

import SubHeader from "./../components/SubHeader";

const CreateGame = ({ className, children }) => {
  const { register, handleSubmit, watch, errors } = useForm();
  const onSubmit = (data) => console.log(data);

  console.log(watch("example")); // watch input value by passing the name of it

  return (
    <div className={className}>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <SubHeader>Create Game</SubHeader>
        <FieldWrapper>
          <Label htmlFor="name">Name</Label>
          <TextFields
            name="name"
            defaultValue=""
            ref={register({ required: true })}
          />
          {errors.email && <ErrorText>This field is required</ErrorText>}
        </FieldWrapper>
        <ButtonWrapper>
          <Button type="submit">Create</Button>
        </ButtonWrapper>
        <Footer>
          <FooterLinks to={"/"}>Back home</FooterLinks>
        </Footer>
      </Form>
    </div>
  );
};

const Footer = styled.footer`
  text-align: center;
`;

const FooterLinks = styled(NavLink)`
  color: #fff;
`;

export default CreateGame;
