import { FC } from "react";
import { MessagePasstroughProps } from "../types";

const ListMain: FC<MessagePasstroughProps> = props => {
    console.log(props);

	return (
		<div>ListMain</div>
	);
};

export default ListMain;
