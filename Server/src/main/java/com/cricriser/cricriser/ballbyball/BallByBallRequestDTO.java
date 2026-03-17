package com.cricriser.cricriser.ballbyball;

import lombok.Data;

@Data
public class BallByBallRequestDTO {

    private String matchId;
    private int innings;

    private int runs;

    private String extraType;
    private int extraRuns;

    private boolean wicket;
    private String wicketType;

    private String runOutEnd;
    private String fielderId;

    //For run out
    private String outBatterId;

    private String newBatterId;
    private String newBowlerId;

    private boolean boundary;
    private int boundaryRuns;
    private boolean overthrowBoundary;
    private int runningRuns;

}
