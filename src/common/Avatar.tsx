import React, { FC } from "react";
import classes from "./Avatar.module.css";
import classnames from "classnames";

interface IAvatarProps {
	alt: string;
	className?: string;
	children: React.ReactNode;
	src: string;
}

const Avatar: FC<IAvatarProps> = props => {
	const classNames = classnames(classes.avatar, props.className, "avatar");

	return <img alt={props.alt} className={classNames} src={props.src} />;
};

export default Avatar;
