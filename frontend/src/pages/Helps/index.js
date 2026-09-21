import React, { useContext, useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import ButtonBase from "@material-ui/core/ButtonBase";

import MainContainer from "../../components/MainContainer";
import useHelps from "../../hooks/useHelps";
import { AuthContext } from "../../context/Auth/AuthContext";
import SupportBoard from "./SupportBoard";
import SupportClient from "./SupportClient";

/**
 * Ajuda.
 *
 * Cliente: abre chamados (com prints) e acompanha as respostas.
 * Super admin: o kanban de suporte, com os chamados de todas as empresas.
 * Os vídeos de ajuda continuam, numa aba própria, quando houver algum.
 */
const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    page: {
      overflowY: "auto",
      ...theme.scrollbarStyles
    },
    tabs: {
      display: "inline-flex",
      alignSelf: "flex-start",
      padding: 3,
      marginBottom: theme.spacing(2),
      borderRadius: t.radius.pill,
      backgroundColor: t.surfaceSunken,
      border: `1px solid ${t.border}`
    },
    tab: {
      height: 34,
      padding: "0 18px",
      borderRadius: t.radius.pill,
      fontSize: "0.875rem",
      fontWeight: 600,
      color: theme.palette.text.secondary
    },
    tabOn: {
      color: t.brand.text,
      backgroundColor: t.surface,
      boxShadow: "0 2px 8px -2px rgba(12, 10, 20, 0.2)"
    },
    videos: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
      gap: theme.spacing(2),
      paddingBottom: theme.spacing(2),
      [theme.breakpoints.down("xs")]: { gridTemplateColumns: "1fr" }
    },
    video: {
      borderRadius: t.radius.lg,
      border: `1px solid ${t.border}`,
      backgroundColor: t.surface,
      overflow: "hidden"
    },
    frame: {
      position: "relative",
      paddingTop: "56.25%",
      backgroundColor: "#000",
      "& iframe": {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        border: 0
      }
    },
    videoText: { padding: theme.spacing(1.5, 2) },
    videoTitle: {
      fontSize: "0.9688rem",
      fontWeight: 700,
      color: theme.palette.text.primary
    },
    videoDesc: {
      marginTop: 2,
      fontSize: "0.875rem",
      color: theme.palette.text.secondary
    }
  };
});

const Helps = () => {
  const classes = useStyles();
  const { user } = useContext(AuthContext);
  const { list } = useHelps();
  const [videos, setVideos] = useState([]);
  const [tab, setTab] = useState("support");

  useEffect(() => {
    list()
      .then(data => setVideos(Array.isArray(data) ? data : []))
      .catch(() => setVideos([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isSuper = !!user?.super;

  return (
    <MainContainer className={classes.page}>
      {videos.length > 0 && (
        <div className={classes.tabs} role="tablist">
          {[
            ["support", isSuper ? "Chamados" : "Suporte"],
            ["videos", `Vídeos · ${videos.length}`]
          ].map(([key, label]) => (
            <ButtonBase
              key={key}
              role="tab"
              aria-selected={tab === key}
              className={`${classes.tab}${tab === key ? ` ${classes.tabOn}` : ""}`}
              onClick={() => setTab(key)}
            >
              {label}
            </ButtonBase>
          ))}
        </div>
      )}

      {tab === "support" && (isSuper ? <SupportBoard /> : <SupportClient />)}

      {tab === "videos" && (
        <div className={classes.videos}>
          {videos.map(video => (
            <div key={video.id || video.video} className={classes.video}>
              <div className={classes.frame}>
                <iframe
                  src={`https://www.youtube.com/embed/${video.video}`}
                  title={video.title}
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
              <div className={classes.videoText}>
                <div className={classes.videoTitle}>{video.title}</div>
                {video.description && (
                  <div className={classes.videoDesc}>{video.description}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </MainContainer>
  );
};

export default Helps;
