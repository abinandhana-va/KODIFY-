package infosys.onlinecodeplate.controller;

import infosys.onlinecodeplate.dto.AppDtos.CertificateDto;
import infosys.onlinecodeplate.dto.AppDtos.CertificateStatusDto;
import infosys.onlinecodeplate.entity.User;
import infosys.onlinecodeplate.repository.UserRepository;
import infosys.onlinecodeplate.service.CertificateService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
public class CertificateController {

    private final CertificateService certificateService;
    private final UserRepository userRepository;

    public CertificateController(CertificateService certificateService, UserRepository userRepository) {
        this.certificateService = certificateService;
        this.userRepository = userRepository;
    }

    @GetMapping({"/api/certificates", "/api/certificate/all"})
    public ResponseEntity<List<CertificateDto>> getMyCertificates(Authentication auth) {
        User user = userRepository.findByEmailOrUsername(auth.getName(), auth.getName()).orElseThrow();
        return ResponseEntity.ok(certificateService.getAllCertificatesForUser(user));
    }

    @GetMapping({"/api/certificate/me", "/api/certificates/me"})
    public ResponseEntity<CertificateStatusDto> getMyCertificateStatusLegacy(Authentication auth) {
        User user = userRepository.findByEmailOrUsername(auth.getName(), auth.getName()).orElseThrow();
        return ResponseEntity.ok(certificateService.getCertificateStatus(user));
    }

    @GetMapping({"/api/certificate/me/download", "/api/certificates/me/download"})
    public ResponseEntity<?> downloadMyCertificateLegacy(Authentication auth) {
        try {
            User user = userRepository.findByEmailOrUsername(auth.getName(), auth.getName()).orElseThrow();
            byte[] pdfBytes = certificateService.generateCertificatePdf(user);

            String safeUsername = user.getUsername() != null ? user.getUsername().replaceAll("[^a-zA-Z0-9_-]", "_") : "User";
            String filename = "KODIFY_Certificate_" + safeUsername + ".pdf";

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .contentLength(pdfBytes.length)
                    .body(pdfBytes);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping({"/api/certificates/{id}/download", "/api/certificate/download/{id}"})
    public ResponseEntity<?> downloadCertificateById(@PathVariable Long id, Authentication auth) {
        try {
            User user = userRepository.findByEmailOrUsername(auth.getName(), auth.getName()).orElseThrow();
            byte[] pdfBytes = certificateService.generateCertificatePdf(user, id);

            String safeUsername = user.getUsername() != null ? user.getUsername().replaceAll("[^a-zA-Z0-9_-]", "_") : "User";
            String filename = "KODIFY_Certificate_" + safeUsername + "_ID" + id + ".pdf";

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .contentLength(pdfBytes.length)
                    .body(pdfBytes);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping({"/api/certificates/download/code/{code}", "/api/certificate/download/code/{code}"})
    public ResponseEntity<?> downloadCertificateByCode(@PathVariable String code) {
        try {
            byte[] pdfBytes = certificateService.generateCertificatePdfByCode(code);
            String safeCode = code.replaceAll("[^a-zA-Z0-9_-]", "_");
            String filename = "KODIFY_Certificate_" + safeCode + ".pdf";

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .contentLength(pdfBytes.length)
                    .body(pdfBytes);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        }
    }
}
