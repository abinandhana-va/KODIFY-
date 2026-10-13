package infosys.onlinecodeplate.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    private Path rootLocation;
    private Path memberProofsLocation;
    private Path governmentIdsLocation;
    private Path examRecordingsLocation;
    private Path questionImagesLocation;

    @PostConstruct
    public void init() {
        this.rootLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        this.memberProofsLocation = this.rootLocation.resolve("member-proofs");
        this.governmentIdsLocation = this.rootLocation.resolve("government-ids");
        this.examRecordingsLocation = this.rootLocation.resolve("exam-recordings");
        this.questionImagesLocation = this.rootLocation.resolve("question-images");

        try {
            Files.createDirectories(this.memberProofsLocation);
            Files.createDirectories(this.governmentIdsLocation);
            Files.createDirectories(this.examRecordingsLocation);
            Files.createDirectories(this.questionImagesLocation);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize file storage directory: " + uploadDir, e);
        }
    }

    public String storeGovernmentId(MultipartFile file, Long userId, int idNumber) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("Government ID " + idNumber + " document is required and cannot be empty.");
        }

        // Validate file size (max 10MB)
        if (file.getSize() > 10 * 1024 * 1024) {
            throw new RuntimeException("Government ID " + idNumber + " document size exceeds maximum limit of 10MB.");
        }

        String originalFilename = file.getOriginalFilename();
        String ext = ".pdf";
        if (originalFilename != null && originalFilename.contains(".")) {
            ext = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
        }

        List<String> allowedExtensions = Arrays.asList(".pdf", ".png", ".jpg", ".jpeg", ".webp");
        if (!allowedExtensions.contains(ext)) {
            throw new RuntimeException("Unsupported document format for Government ID " + idNumber + ". Allowed formats: PDF, PNG, JPG, JPEG, WEBP.");
        }

        String contentType = file.getContentType();
        if (contentType != null && !contentType.isBlank()) {
            String cleanType = contentType.toLowerCase().trim();
            if (!cleanType.contains("pdf") && !cleanType.contains("image") && !cleanType.equals("application/octet-stream")) {
                throw new RuntimeException("Invalid MIME type for Government ID " + idNumber + ": " + contentType);
            }
        }

        String safeFileName = "govid" + idNumber + "_u" + userId + "_" + UUID.randomUUID().toString().replace("-", "") + ext;
        Path targetPath = this.governmentIdsLocation.resolve(safeFileName).normalize();

        try {
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            return "government-ids/" + safeFileName;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store Government ID " + idNumber + " document.", e);
        }
    }

    public String storeMemberProof(MultipartFile file, Long userId) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("Member proof PDF file is required and cannot be empty.");
        }

        // Validate file size (max 10MB)
        if (file.getSize() > 10 * 1024 * 1024) {
            throw new RuntimeException("Member proof file size exceeds maximum limit of 10MB.");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !originalFilename.toLowerCase().endsWith(".pdf")) {
            throw new RuntimeException("Only PDF documents (.pdf) are accepted for member proof.");
        }

        String contentType = file.getContentType();
        if (contentType != null && !contentType.isBlank()) {
            String cleanType = contentType.toLowerCase().trim();
            if (!cleanType.contains("pdf") && !cleanType.equals("application/octet-stream")) {
                throw new RuntimeException("Invalid MIME type for member proof. Expected application/pdf, received: " + contentType);
            }
        }

        // Verify PDF Magic Bytes (%PDF-)
        try (InputStream is = file.getInputStream()) {
            byte[] header = new byte[5];
            int read = is.read(header);
            if (read < 4 || header[0] != '%' || header[1] != 'P' || header[2] != 'D' || header[3] != 'F') {
                throw new RuntimeException("Corrupted or invalid PDF content. File header is not a valid PDF.");
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to read member proof file content.", e);
        }

        String safeFileName = "proof_u" + userId + "_" + UUID.randomUUID().toString().replace("-", "") + ".pdf";
        Path targetPath = this.memberProofsLocation.resolve(safeFileName).normalize();

        try {
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            return "member-proofs/" + safeFileName;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store member proof PDF file.", e);
        }
    }

    public String storeExamRecording(MultipartFile file, Long attemptId, String recordingType) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("Recording media stream cannot be empty.");
        }

        // Validate file size (max 100MB)
        if (file.getSize() > 100 * 1024 * 1024) {
            throw new RuntimeException("Exam recording stream exceeds maximum limit of 100MB.");
        }

        String safeType = (recordingType != null ? recordingType.toLowerCase() : "video");
        String ext = ".webm";
        if (file.getOriginalFilename() != null && file.getOriginalFilename().contains(".")) {
            String origExt = file.getOriginalFilename().substring(file.getOriginalFilename().lastIndexOf(".")).toLowerCase();
            if (origExt.equals(".mp4") || origExt.equals(".webm") || origExt.equals(".ogg") || origExt.equals(".wav")) {
                ext = origExt;
            }
        }

        String safeFileName = "rec_att" + attemptId + "_" + safeType + "_" + UUID.randomUUID().toString().replace("-", "") + ext;
        Path targetPath = this.examRecordingsLocation.resolve(safeFileName).normalize();

        try {
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            return "exam-recordings/" + safeFileName;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store exam recording media stream.", e);
        }
    }

    public String storeQuestionImage(MultipartFile file, Long userId) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("Question image file cannot be empty.");
        }

        // Validate file size (max 5MB)
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new RuntimeException("Question image size exceeds maximum limit of 5MB.");
        }

        String originalFilename = file.getOriginalFilename();
        String ext = ".png";
        if (originalFilename != null && originalFilename.contains(".")) {
            ext = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
        }

        List<String> allowedExtensions = Arrays.asList(".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif");
        if (!allowedExtensions.contains(ext)) {
            throw new RuntimeException("Unsupported image format. Allowed formats: PNG, JPG, JPEG, WEBP, SVG, GIF.");
        }

        String safeFileName = "qimg_u" + (userId != null ? userId : "anon") + "_" + UUID.randomUUID().toString().replace("-", "") + ext;
        Path targetPath = this.questionImagesLocation.resolve(safeFileName).normalize();

        try {
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            return "/api/assignments/questions/images/" + safeFileName;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store question image.", e);
        }
    }

    public Resource loadAsResource(String relativePath) {
        try {
            Path filePath = this.rootLocation.resolve(relativePath).normalize();
            if (!filePath.startsWith(this.rootLocation)) {
                throw new RuntimeException("Cannot access file outside current storage root.");
            }
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new RuntimeException("File not found or not readable: " + relativePath);
            }
        } catch (MalformedURLException e) {
            throw new RuntimeException("Error resolving file path: " + relativePath, e);
        }
    }

    public void deleteFile(String relativePath) {
        try {
            Path filePath = this.rootLocation.resolve(relativePath).normalize();
            if (filePath.startsWith(this.rootLocation)) {
                Files.deleteIfExists(filePath);
            }
        } catch (IOException ignored) {}
    }
}
