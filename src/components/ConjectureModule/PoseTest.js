import PoseTestMatch from "./PoseTestMatch";
import Background from "../Background";
import { Graphics } from "@inlet/react-pixi";
import { darkGray, yellow } from "../../utils/colors";
import React, { useCallback } from "react";
import { send } from "xstate";

const PoseTest = (props) => {
    const { height, width, columnDimensions, rowDimensions, editCallback, conjectureCallback, poseData,UUID } = props;
    const drawModalBackground = useCallback((g) => {
        g.beginFill(darkGray, 0.9);
        g.drawRect(0, 0, window.innerWidth, window.innerHeight);
        g.endFill();
        const col1 = columnDimensions(1);
        g.beginFill(yellow, 1);
        g.drawRect(col1.x, col1.y, col1.width, col1.height);
        const col3 = columnDimensions(3);
        g.drawRect(col3.x, col3.y, col3.width, col3.height);
        g.endFill();
      }, []);

// Use background and graphics to draw background and then initiate conjecturePoseMatch
    return (
    <>
        <Background height={height * 1.1} width={width} />
        <Graphics draw={drawModalBackground} />
        <PoseTestMatch
            height={height}
            width={width}
            columnDimensions={columnDimensions}
            rowDimensions={rowDimensions}
            conjectureCallback={conjectureCallback}
            poseData = {poseData}
        />
    </>
    );
};

export default PoseTest;