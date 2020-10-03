import styled from "styled-components";


const Form = styled.form`
  position: relative;
  padding: 10px;
  flex: 1;
`;

const FieldWrapper = styled.div`
  padding: 10px;
  height: 100px;
`;

const Label = styled.label`
  color: #fff;
  font-size: 18px;
`;

const TextFields = styled.input`
  display: block;
  width: 100%;
  font-size: 25px;
  padding: 3px 5px;
  border-radius: 5px;
`;

const ErrorText = styled.span`
  color: #fff;
`;

const ButtonWrapper = styled.div`
  padding: 10px;
  text-align: right;
`;

const Button = styled.button`
  background-color: #1e421e;
  padding: 10px 10px;
  font-size: 15px;
  font-weight: 600;
  border: none;
  border-radius: 5px;
  width: 100%;
  color: #fff;
`;

export {
    Form,
    FieldWrapper,
    Label,
    TextFields,
    ErrorText,
    ButtonWrapper,
    Button
};