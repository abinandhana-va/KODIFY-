package infosys.onlinecodeplate.controller;

import infosys.onlinecodeplate.dto.AppDtos.CertificateDto;
import infosys.onlinecodeplate.dto.AppDtos.CertificateRequestDto;
import infosys.onlinecodeplate.service.CertificateService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/certificates")
public class AdminCertificateController {

    private final CertificateService certificateService;

    public AdminCertificateController(CertificateService certificateService) {
        this.certificateService = certificateService;
    }

    @GetMapping
    public ResponseEntity<List<CertificateDto>> getAllCertificates() {
        return ResponseEntity.ok(certificateService.getAllCertificatesForAdmin());
    }

    @PostMapping
    public ResponseEntity<?> createCertificate(@Valid @RequestBody CertificateRequestDto req) {
        try {
            return ResponseEntity.ok(certificateService.createCertificate(req));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCertificate(@PathVariable Long id, @Valid @RequestBody CertificateRequestDto req) {
        try {
            return ResponseEntity.ok(certificateService.updateCertificate(id, req));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCertificate(@PathVariable Long id) {
        try {
            certificateService.deleteCertificate(id);
            return ResponseEntity.ok(Map.of("message", "Certificate deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
