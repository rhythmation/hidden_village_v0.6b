import React from 'react';
import {Container, Sprite, Text,Graphics } from "@inlet/react-pixi";
import { TextStyle } from "@pixi/text";
import RectButton from '../RectButton';  // Replace with your actual UI library
import UserObject from './UserObject'
import { green, neonGreen, black, blue, white, pink, orange, red, transparent, turquoise } from "../../utils/colors";
import { useState } from 'react';


const UserList = (props) => {
    const { width, height, x, y, users, refreshUserListCallback } = props;

        const [startIndex, setStartIndex] = useState(0);

        const usersPerPage = 15;
    
        // Function to handle incrementing the start index
        const handleNextPage = () => {
            if (startIndex + usersPerPage < users.length) {
                setStartIndex(startIndex + usersPerPage);
            }
        };
    
        // Function to handle decrementing the start index
        const handlePrevPage = () => {
            if (startIndex - usersPerPage >= 0) {
                setStartIndex(startIndex - usersPerPage);
            }
        };
    
        // Slice the users based on the current start index and number of users per page
        const displayedUsers = users.slice(startIndex, startIndex + usersPerPage);
    

        // height={height * 0.13}
        // width={width * 0.26}
        // x={width * 0.4}
        // y={height * 0.93}

    return (
        <>
            <Graphics
                x = {width *0.1}
                y = {height *0.265}
                draw={(g) => {
                    // rectangle
                    g.beginFill(0xe0c755);
                    g.drawRect(0, 0, width*.5, ( (displayedUsers.length + 1) * 25) + 10);
                    g.endFill();
                    // border
                    g.lineStyle(4, 0x000000, 1);
                    g.drawRect(0, 0, width*0.5, ( (displayedUsers.length + 1) * 25) + 10);
                }}
            />
            <Text
                x={width * 0.1}
                y={height* 0.2}
                text={`User`}
                style={
                    new TextStyle({
                        align: 'center',
                        fontFamily: 'Futura',
                        fontSize: 60,
                        fontWeight: 800,
                        fill: ['orange'],
                        letterSpacing: -5,
                    })
                }
            />
            <Text
                x={width * 0.4}
                y={height * 0.2}
                text={`Role`}
                style={
                    new TextStyle({
                        align: 'center',
                        fontFamily: 'Futura',
                        fontSize: 60,
                        fontWeight: 800,
                        fill: ['orange'],
                        letterSpacing: -5,
                    })
                }
            />
            {/* Display User Names */}
            {/* <ScrollView style={{ flex: 1 }}> */}
            {displayedUsers.map((user, index) => (
                <UserObject
                    key={index} 
                    width={width * 0.1}
                    height={height* 0.6}
                    x={x}
                    y={y * 0.2 + (index + 1.2) * 25}  // Adjust the y position based on index
                    index={index}
                    username={user.userName}
                    role={user.userRole}
                    userId = {user.userId}
                    refreshUserListCallback = {refreshUserListCallback}
                />              
            ))}
            {/* // < Button // */}
            <RectButton
                height={height * 0.1}
                width={width * .1}
                x={width * .5}
                y={height*.22}
                color={green}
                fontSize={width * .02}
                fontColor={white}
                text={"<"}
                fontWeight={800}
                callback={() => {
                    handlePrevPage();
                }}
            />
            {/* // > Button // */}
            <RectButton
                height={height * 0.1}
                width={width * .1}
                x={width * .55}
                y={height*.22}
                color={green}
                fontSize={width * .02}
                fontColor={white}
                text={">"}
                fontWeight={800}
                callback={() => {
                    handleNextPage();
                }}
            />
        </>
    );
};

export default UserList;
