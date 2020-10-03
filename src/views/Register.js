import React from "react";
import styled from "styled-components";
import { NavLink } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers";

import { createUser } from "./../store/actions/user";

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

const schema = yup.object().shape({
  email: yup.string().email().required(),
  password: yup.string().min(8).required(),
});

const Register = ({ className, children }) => {
  const dispatch = useDispatch();
  const { register, handleSubmit, errors } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = (data) => {
    dispatch(createUser(data));
  };

  return (
    <div className={className}>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <SubHeader>Register</SubHeader>
        <FieldWrapper>
          <Label htmlFor="email">Email</Label>
          <TextFields name="email" defaultValue="" ref={register} />
          <ErrorText>{errors.email?.message}</ErrorText>
        </FieldWrapper>
        <FieldWrapper>
          <Label htmlFor="password">Password</Label>
          <TextFields name="password" ref={register} />
          <ErrorText>{errors.password?.message}</ErrorText>
        </FieldWrapper>
        <ButtonWrapper>
          <Button type="submit">Register</Button>
        </ButtonWrapper>
        <Footer>
          <FooterLinks to={"/login"}>Login</FooterLinks>
        </Footer>
      </Form>
    </div>
  );
};

const RegisterStyled = styled(Register)``;

const Footer = styled.footer`
  text-align: center;
`;

const FooterLinks = styled(NavLink)`
  color: #fff;
`;

export default RegisterStyled;
