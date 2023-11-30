import { FC, ReactNode } from "react";
import classnames from "classnames";

import classes from "./Avatar.module.css";

type TagVariants = 
	"h1-semibold" |
	"h2-regular" |
	"h2-semibold" |
	"title1-semibold" |
	"title1-regular" |
	"title2-semibold" |
	"title2-regular" |
	"body-regular" |
	"body-semibold" |
	"copy-medium" |
	"cta-semibold";

type TypographyProps = {
	variant?: TagVariants,
	children: ReactNode,
	className?: string,
	component?: keyof JSX.IntrinsicElements,
}

// Create a mapping between the variants and the html tags
const variantsMapping: Record<TagVariants, keyof JSX.IntrinsicElements> = {
	"h1-semibold": "h1",
	"h2-regular": "h2",
  	"h2-semibold": "h2",
  	"title1-semibold": "h3",
  	"title1-regular": "h4",
  	"title2-semibold": "h5",
	"title2-regular": "h6",
	"body-semibold": "p",
	"body-regular": "p",
	"copy-medium": "p",
	"cta-semibold": "p",
};

const Typography: FC<TypographyProps> = (props) => {
	const { variant="body-regular", children, component, className, ...restProps } = props;
	const Component = component ?? variantsMapping[variant];

	return (
		<Component className={classnames(classes[variant], className)} {...restProps}>
			{children}
		</Component>
	);
};

export default Typography;