import { FC } from "react";

const ListRegular: FC<{element: any}> = (props) => {
	console.log(props.element);
	
	return (
		<div>ListRegular</div>
	);
};

export default ListRegular;
