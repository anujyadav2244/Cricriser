package com.cricriser.cricriser.player;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/player")
@RequiredArgsConstructor
@CrossOrigin(
        origins = "${app.allowed.origins:http://localhost:5173}",
        allowCredentials = "true"
)
public class PlayerController {

    private final PlayerService playerService;

    @PostMapping(value = "/profile", consumes = "multipart/form-data")
    public ResponseEntity<?> createProfile(
            @RequestHeader("Authorization") String token,
            @RequestParam("name") String name,
            @RequestParam("role") String role,
            @RequestParam(value = "battingStyle", required = false) String battingStyle,
            @RequestParam(value = "bowlingType", required = false) String bowlingType,
            @RequestParam(value = "bowlingHand", required = false) String bowlingHand,
            @RequestParam(value = "bowlingStyle", required = false) String bowlingStyle,
            @RequestParam(value = "photo", required = false) MultipartFile photo
    ) {
        try {
            return ResponseEntity.ok(
                    playerService.createPlayerProfile(
                            token.replace("Bearer ", ""),
                            name, role, battingStyle,
                            bowlingType, bowlingHand, bowlingStyle,
                            photo
                    )
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping(
            value = "/update",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<?> updateProfile(
            @RequestHeader("Authorization") String token,
            @RequestPart(required = false) String name,
            @RequestPart(required = false) String role,
            @RequestPart(required = false) String battingStyle,
            @RequestPart(required = false) String bowlingType,
            @RequestPart(required = false) String bowlingHand,
            @RequestPart(required = false) String bowlingStyle,
            @RequestPart(required = false) MultipartFile photo
    ) {
        try {
            return ResponseEntity.ok(
                    playerService.updateProfile(
                            token.replace("Bearer ", ""),
                            name,
                            role,
                            battingStyle,
                            bowlingType,
                            bowlingHand,
                            bowlingStyle,
                            photo
                    )
            );
        } catch (Exception e) {
            e.printStackTrace(); // 🔥 MUST KEEP
            return ResponseEntity.badRequest().body(
                    Map.of("error", e.getMessage())
            );
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(
            @RequestHeader("Authorization") String token) {

        try {
            return ResponseEntity.ok(
                    playerService.getMyProfile(
                            token.replace("Bearer ", "")
                    )
            );
        } catch (IllegalStateException e) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/delete")
    public ResponseEntity<?> delete(
            @RequestHeader("Authorization") String token) {

        playerService.deleteProfile(
                token.replace("Bearer ", "")
        );

        return ResponseEntity.ok(
                Map.of("message", "Player profile deleted")
        );
    }
}
