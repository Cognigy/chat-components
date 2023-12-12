import { CSSProperties, FC, ReactNode } from "react";
import classes from "./Typography.module.css";
import classnames from "classnames";

export interface TypographyProps extends CSSProperties {
	variant?: TagVariants;
	children?: ReactNode;
	className?: string;
	component?: keyof JSX.IntrinsicElements;
	dangerouslySetInnerHTML?: { __html: string | TrustedHTML; } | undefined;
	id?: string;
}

type TagVariants =
	| "h1-semibold"
	| "h2-regular"
	| "h2-semibold"
	| "title1-semibold"
	| "title1-regular"
	| "title2-semibold"
	| "title2-regular"
	| "body-regular"
	| "body-semibold"
	| "copy-medium"
	| "cta-semibold";

type ColorVariants = "primary" | "secondary";

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

const colorsMapping: Record<ColorVariants, string> = {
	primary: "var(--primary-color)",
	secondary: "var(--secondary-color)",
};

const Typography: FC<TypographyProps> = props => {
	const { variant = "body-regular", children, component, className, color, dangerouslySetInnerHTML, ...restProps } = props;
	const Component = component ?? variantsMapping[variant];
	const typographyColor = colorsMapping[color as ColorVariants] ?? color;

	return (
		<Component
			className={classnames(classes[variant], className, color)}
			style={{ color: typographyColor, ...restProps }}
			dangerouslySetInnerHTML={dangerouslySetInnerHTML}
		>
			{children}
		</Component>
	);
};

export default Typography;
