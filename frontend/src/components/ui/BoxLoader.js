import React from "react";
import styled from "styled-components";
import { useTheme } from "@material-ui/core/styles";

/**
 * Animação de carregamento do sistema: um quadrado que vai sendo preenchido
 * de canto a canto. Usada em todo lugar que antes mostrava a logo com barra
 * ou a rodinha girando.
 *
 * A cor vem do tema (currentColor), então as keyframes são sempre as mesmas —
 * nada de gerar uma animação por cor ou tamanho. O tamanho muda por escala.
 */
const BASE = 72; // lado total, com a borda — o tamanho padrão do sistema
const BORDER = 5;
const HALF = (BASE - BORDER * 2) / 2;

const StyledWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;

  .box {
    flex: none;
    box-sizing: content-box;
    width: ${BASE - BORDER * 2}px;
    height: ${BASE - BORDER * 2}px;
    border: ${BORDER}px solid currentColor;
    box-shadow: inset 0 0 0 currentColor;
    animation: tkvBoxLoad 2s ease-in-out infinite;
    transform: scale(var(--tkv-loader-scale, 1));
  }

  @keyframes tkvBoxLoad {
    0% {
      box-shadow: inset -${HALF}px -${HALF}px 0 currentColor;
    }
    25% {
      box-shadow: inset ${HALF}px -${HALF}px 0 currentColor;
    }
    50% {
      box-shadow: inset ${HALF}px ${HALF}px 0 currentColor;
    }
    75% {
      box-shadow: inset -${HALF}px ${HALF}px 0 currentColor;
    }
    100% {
      box-shadow: inset -${HALF}px -${HALF}px 0 currentColor;
    }
  }
`;

const BoxLoader = ({ size = BASE, color, className, style, label }) => {
  const theme = useTheme();
  return (
    <StyledWrapper
      role="status"
      aria-label={label || "Carregando"}
      className={className}
      style={{
        width: size,
        height: size,
        color:
          color || theme.palette.tkv?.brand?.text || theme.palette.primary.main,
        "--tkv-loader-scale": size / BASE,
        ...style
      }}
    >
      <div className="box" />
    </StyledWrapper>
  );
};

export default BoxLoader;
