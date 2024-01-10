import { ButtonHTMLAttributes, FC, ReactElement } from "react";
import Typography from "../Typography";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	size?: "small" | "large";
	icon?: ReactElement;
}

const Button: FC<ButtonProps> = props => {
	const { size, icon, children, ...restProps } = props;
	return (
		<button {...restProps}>
			<Typography
				variant={size === "large" ? "title1-regular" : "cta-semibold"}
				component="span"
			>
				{children}
			</Typography>
			{icon && icon}
		</button>
	);
};

export default Button;
