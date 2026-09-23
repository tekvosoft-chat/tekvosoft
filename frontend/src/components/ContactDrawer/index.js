import React, { useEffect, useState } from "react";

import { makeStyles, useTheme } from "@material-ui/core/styles";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import Drawer from "@material-ui/core/Drawer";

import ContactDrawerSkeleton from "../ContactDrawerSkeleton";
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
    // transparente: o vidro fosco fica no conteúdo (PhoneContactDetails)
    backgroundColor: "transparent",
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

  const [showTags, setShowTags] = useState(false);

  useEffect(() => {
    getSetting("tagsMode").then(res => {
      setShowTags(["contact", "both"].includes(res));
    });
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
