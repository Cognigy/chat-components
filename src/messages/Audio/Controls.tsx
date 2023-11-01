/* eslint-disable @typescript-eslint/no-explicit-any */
import { FC, useEffect, useRef, useState } from "react";
import classes from "./Audio.module.css";
import { PlayIcon, PauseIcon } from "src/assets/svg";

type ControlsProps = {
	playerRef: any;
	playing: boolean;
	progress: number;
	duration: number;
	handlePlay: () => void;
	handlePause: () => void;
};

const Controls: FC<ControlsProps> = props => {
	const { playerRef, playing, progress, duration, handlePlay, handlePause } = props;

	const [played, setPlayed] = useState(0);
	const [seeking, setSeeking] = useState(false);
	const playPauseButtonRef = useRef<HTMLButtonElement>(null);

	const togglePlayAndPause = () => {
		if (playing) {
			handlePause();
		} else {
			handlePlay();
		}
	};

    const handleSeekMouseDown = () => {
		setSeeking(true);
	};

    const handleSeekChange = (e: any) => {
        playerRef.current?.seekTo(parseFloat(e.target.value));
		setPlayed(parseFloat(e.target.value));
	};

	const handleSeekMouseUp = () => {
		setSeeking(false);
	};

    useEffect(() => {
		setPlayed(prevPlayed => {
			if (prevPlayed !== progress) {
				return progress;
			}
			return prevPlayed;
		});
    }, [progress, seeking]);
    
    const formatTime = () => {
        const padString = (string: number) => {
            return ("0" + string).slice(-2);
        };

        const seconds = duration * (1 - played);
        const date = new Date(seconds * 1000);
        const hh = date.getUTCHours();
        const mm = date.getUTCMinutes();
        const ss = padString(date.getUTCSeconds());
        if (hh) {
            return `${hh}:${padString(mm)}:${ss}`;
        }
        return `${mm}:${ss}`;
    };

	return (
		<div className={classes.controls}>
            <div className="duration">
                <time>{formatTime()}</time>
			</div>

			<div className={classes.progressBar}>
				<input
					type="range"
					min={0}
					max={0.999999}
					step="any"
					value={played}
					onMouseDown={handleSeekMouseDown}
					onChange={handleSeekChange}
					onMouseUp={handleSeekMouseUp}
					style={{
						background: `linear-gradient(to right, var(--primary-color) ${
							progress * 100
						}%, #ccc ${progress * 100}%)`,
					}}
				/>
			</div>

			<div className="buttons">
				<button
					ref={playPauseButtonRef}
					className={classes.playButton}
					onClick={togglePlayAndPause}
				>
					{playing ? (
						<PauseIcon className={classes.pauseIcon} />
					) : (
						<PlayIcon className={classes.playIcon} />
					)}
				</button>
			</div>
		</div>
	);
};

export default Controls;
