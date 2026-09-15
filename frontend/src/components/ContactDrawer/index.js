import React, { useEffect, useState } from "react";

import { makeStyles, useTheme } from "@material-ui/core/styles";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import Typography from "@material-ui/core/Typography";
import IconButton from "@material-ui/core/IconButton";
import CloseIcon from "@material-ui/icons/Close";
import Drawer from "@material-ui/core/Drawer";
import Link from "@material-ui/core/Link";
import Avatar from "@material-ui/core/Avatar";
import Button from "@material-ui/core/Button";
import Paper from "@material-ui/core/Paper";

import { i18n } from "../../translate/i18n";
import {
  formatWhatsappContactName,
  formatWhatsappContactNumber
} from "../../helpers/formatWhatsappDisplay";

import ContactDrawerSkeleton from "../ContactDrawerSkeleton";
import WhatsMarked from "react-whatsmarked";
import { CardHeader } from "@material-ui/core";
import ContactModal from "../ContactModal";
import { TicketNotes } from "../TicketNotes";
import { generateColor } from "../../helpers/colorGenerator";
import { getInitials } from "../../helpers/getInitials";
import { TagsContainer } from "../TagsContainer";
import useSettings from "../../hooks/useSettings";
import PhoneContactDetails from "./PhoneContactDetails";

// um pouco mais larga, como a coluna de dados do WhatsApp Web
const drawerWidth = 380;

const useStyles = makeStyles(theme => ({
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
    [theme.breakpoints.down(1400)]: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0
    }
  },

  drawerHidden: {
    display: "none"
  },

  drawerPaper: {
    width: drawerWidth,
    display: "flex",
    borderTop: "1px solid rgba(0, 0, 0, 0.12)",
    borderRight: "1px solid rgba(0, 0, 0, 0.12)",
    borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4
  },
  header: {
    display: "flex",
    borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
    alignItems: "center",
    padding: theme.spacing(0, 1),
    minHeight: "73px",
    justifyContent: "flex-start"
  },
  content: {
    display: "flex",

    flexDirection: "column",
    padding: "8px 0px 8px 8px",
    height: "100%",
    overflowY: "scroll",
    ...theme.scrollbarStyles
  },

  contactAvatar: {
    margin: 15,
    width: 100,
    height: 100
  },

  contactHeader: {
    display: "flex",
    padding: 8,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    "& > *": {
      margin: 4
    }
  },

  contactDetails: {
    marginTop: 8,
    padding: 8,
    display: "flex",
    flexDirection: "column"
  },
  contactExtraInfo: {
    marginTop: 4,
    padding: 6
  }
}));

const ContactDrawer = ({
  open,
  handleDrawerClose,
  contact,
  ticket,
  loading
}) => {
  const classes = useStyles();
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("xs"));
  const { getSetting } = useSettings();
  const formattedContactName = formatWhatsappContactName(contact, ticket);

  const [modalOpen, setModalOpen] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [showTags, setShowTags] = useState(false);

  useEffect(() => {
    getSetting("tagsMode").then(res => {
      setShowTags(["contact", "both"].includes(res));
    });

    setOpenForm(false);
  }, [open, contact]);

  // no celular os dados do contato são uma tela inteira, como no WhatsApp
  if (isPhone) {
    return (
      <PhoneContactDetails
        open={open && !loading}
        onClose={handleDrawerClose}
        contact={contact}
        ticket={ticket}
        showTags={showTags}
      />
    );
  }

  return (
    <>
      <Drawer
        className={open ? classes.drawer : classes.drawerHidden}
        variant="persistent"
        anchor="right"
        open={open}
        PaperProps={{ style: { position: "absolute" } }}
        BackdropProps={{ style: { position: "absolute" } }}
        ModalProps={{
          container: document.getElementById("drawer-container"),
          style: { position: "absolute" }
        }}
        classes={{
          paper: classes.drawerPaper
        }}
      >
        {loading ? (
          <ContactDrawerSkeleton classes={classes} />
        ) : (
          <PhoneContactDetails
            variant="desktop"
            open={open}
            onClose={handleDrawerClose}
            contact={contact}
            ticket={ticket}
            showTags={showTags}
          />
        )}
      </Drawer>
    </>
  );
};

export default ContactDrawer;
