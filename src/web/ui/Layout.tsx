import * as React from "react";
import { UserMetadata } from "../service-layer/types";

export interface ILayoutProps {
  onHomeClick: () => void;
  userMetadata?: UserMetadata | null;
}

function getInitialsFromName(name: string) {
  return name
    .split(" ")
    .map((parts) => parts[0] || "")
    .join("");
}

export const HeaderLayout: React.StatelessComponent<ILayoutProps> = (props) => {
  return (
    <div className="frame">
      <div className="header">
        <i
          className="ski ski-skedulo header__logo"
          onClick={props.onHomeClick}
        />
        <div className="header__text">Skedulo SDK</div>
        <div className="header__actions">
          <div className="header__user">
            {(props.userMetadata &&
              getInitialsFromName(props.userMetadata.fullName)) ||
              "--"}
          </div>
        </div>
      </div>
      <div className="content">{props.children}</div>

      <div>
        <div className="footer__text" style={{ textAlign: "center" }}>
          © 2023 Skedulo, edit by CX
        </div>
      </div>
    </div>
  );
};

export interface IContentProps {
  centered?: boolean;
  className?: string;
}

export const ContentLayout: React.StatelessComponent<IContentProps> = (
  props
) => {
  return (
    <div
      data-sk-name="content"
      className={
        (props.centered ? "content__center text-center " : "padding ") +
        (props.className ? props.className : "")
      }
    >
      {props.children}
    </div>
  );
};
