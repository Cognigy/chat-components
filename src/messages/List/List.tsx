import { FC } from "react";
import { MessagePasstroughProps } from "../types";

const List: FC<MessagePasstroughProps> = props => {
    console.log(props);

	return (
		<div>List</div>
	);
};

export default List;
