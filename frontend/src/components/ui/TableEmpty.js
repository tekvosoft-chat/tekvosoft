import React from "react";
import PropTypes from "prop-types";
import TableRow from "@material-ui/core/TableRow";
import TableCell from "@material-ui/core/TableCell";
import { makeStyles } from "@material-ui/core/styles";

import EmptyState from "./EmptyState";

/**
 * Linha de "nada por aqui" para as listagens.
 *
 * Existe porque hoje uma tabela sem registros vira um retângulo branco de
 * altura inteira, sem uma palavra. A pessoa não sabe se ainda está
 * carregando, se o filtro não achou nada ou se nunca houve registro — e não
 * descobre onde clicar para criar o primeiro.
 */
const useStyles = makeStyles({
  cell: {
    borderBottom: "none",
    padding: 0
  }
});

const TableEmpty = ({ show, colSpan, icon, title, description, action }) => {
  const classes = useStyles();

  if (!show) return null;

  return (
    <TableRow>
      <TableCell colSpan={colSpan} className={classes.cell}>
        <EmptyState
          icon={icon}
          title={title}
          description={description}
          action={action}
        />
      </TableCell>
    </TableRow>
  );
};

TableEmpty.propTypes = {
  show: PropTypes.bool,
  colSpan: PropTypes.number.isRequired,
  icon: PropTypes.node,
  title: PropTypes.node,
  description: PropTypes.node,
  action: PropTypes.node
};

export default TableEmpty;
