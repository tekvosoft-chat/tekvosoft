import express from "express";
import isAuth from "../middleware/isAuth";
import isSuper from "../middleware/isSuper";
import * as QueueOptionController from "../controllers/QueueOptionController";
import * as InvoicesController from "../controllers/InvoicesController";

const invoiceRoutes = express.Router();

// SEGURANÇA: listar todas as faturas e mudar status é só do super admin
// (antes qualquer usuário via as faturas de todas as empresas e podia
// marcar a própria como "paga")
invoiceRoutes.get("/invoices", isAuth, isSuper, InvoicesController.index);
invoiceRoutes.get("/invoices/list", isAuth, InvoicesController.list);
invoiceRoutes.get("/invoices/all", isAuth, InvoicesController.list);
invoiceRoutes.get("/invoices/:Invoiceid", isAuth, InvoicesController.show);
invoiceRoutes.put("/invoices/:id", isAuth, isSuper, InvoicesController.update);

export default invoiceRoutes;
