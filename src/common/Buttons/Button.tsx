import { ButtonHTMLAttributes, FC, ReactElement, forwardRef } from "react";
import Typography from "../Typography";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	size?: "small" | "large";
	icon?: ReactElement;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
	const { size, icon, children, ...restProps } = props;
	return (
		<button {...restProps} ref={ref}>
			<Typography
				variant={size === "large" ? "title1-regular" : "cta-semibold"}
				component="span"
			>
				{children}
			</Typography>
			{icon && icon}
		</button>
	);
});

export default Button;
