import React, { FC } from "react";
import classes from "./Header.module.css";
import classnames from "classnames";

interface HeaderProps {
	className?: string;
	children?: React.ReactNode;
}

/**
 * Message Header includes:
 * - the avatar (for non-user messages)
 * - timestamp
 * - optional message plugins (e.g. Rating)
 */
const Header: FC<HeaderProps> = props => {
	const classNames = classnames(classes.header, props.className, " message-header");

	return <header className={classNames}>{props.children}</header>;
};

export default Header;
