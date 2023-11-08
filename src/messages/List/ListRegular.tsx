import { FC } from "react";
import { MessagePasstroughProps } from "../types";

const ListRegular: FC<MessagePasstroughProps> = props => {
    console.log(props);

	return (
		<div>ListRegular</div>
	);
};

export default ListRegular;
