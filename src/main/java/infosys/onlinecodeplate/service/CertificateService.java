package infosys.onlinecodeplate.service;

import com.lowagie.text.Chunk;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfContentByte;
import com.lowagie.text.pdf.PdfGState;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import infosys.onlinecodeplate.dto.AppDtos.CertificateDto;
import infosys.onlinecodeplate.dto.AppDtos.CertificateRequestDto;
import infosys.onlinecodeplate.dto.AppDtos.CertificateStatusDto;
import infosys.onlinecodeplate.dto.AppDtos.UserContestStatsDto;
import infosys.onlinecodeplate.entity.Certificate;
import infosys.onlinecodeplate.entity.User;
import infosys.onlinecodeplate.entity.UserCertificate;
import infosys.onlinecodeplate.repository.CertificateRepository;
import infosys.onlinecodeplate.repository.UserCertificateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CertificateService {

    private final CertificateRepository certificateRepo;
    private final UserCertificateRepository userCertificateRepo;
    private final AchievementService achievementService;
    private final ActivityService activityService;
    private final EmailService emailService;
    private final NotificationService notificationService;

    @Autowired
    public CertificateService(CertificateRepository certificateRepo,
                              UserCertificateRepository userCertificateRepo,
                              AchievementService achievementService,
                              ActivityService activityService,
                              EmailService emailService,
                              NotificationService notificationService) {
        this.certificateRepo = certificateRepo;
        this.userCertificateRepo = userCertificateRepo;
        this.achievementService = achievementService;
        this.activityService = activityService;
        this.emailService = emailService;
        this.notificationService = notificationService;
    }

    // Overload for testing
    public CertificateService(CertificateRepository certificateRepo,
                              UserCertificateRepository userCertificateRepo,
                              AchievementService achievementService,
                              ActivityService activityService,
                              EmailService emailService) {
        this(certificateRepo, userCertificateRepo, achievementService, activityService, emailService, null);
    }

    @Transactional
    public List<CertificateDto> getAllCertificatesForUser(User user) {
        List<Certificate> activeCerts = certificateRepo.findByEnabledTrueOrderByTargetAsc();

        long uniqueSolved = user != null ? achievementService.countUniqueSolvedProblems(user.getId()) : 0;
        UserContestStatsDto contestStats = user != null ? achievementService.getUserContestStats(user.getId()) : new UserContestStatsDto(0, 0, 0, 0, 0);

        List<UserCertificate> userCerts = user != null ? userCertificateRepo.findByUserId(user.getId()) : Collections.emptyList();
        Map<Long, UserCertificate> userCertMap = userCerts.stream()
                .filter(uc -> uc.getCertificate() != null)
                .collect(Collectors.toMap(uc -> uc.getCertificate().getId(), uc -> uc, (a, b) -> a));

        List<CertificateDto> dtos = new ArrayList<>();

        for (Certificate c : activeCerts) {
            // Specific contest achievement certificates are handled directly via user certificates
            if ("CONTEST".equalsIgnoreCase(c.getCategory()) || "CONTEST_RANK_1".equalsIgnoreCase(c.getAchievementType())) {
                continue;
            }

            long currentMetricValue = getMetricValue(c.getAchievementType(), uniqueSolved, contestStats);
            boolean isEligible = currentMetricValue >= c.getTarget();

            UserCertificate uc = userCertMap.get(c.getId());
            if (isEligible) {
                if (uc == null && user != null) {
                    String certCode = generateCertificateCode(user, c);
                    String renderedDoc = renderDocumentTemplate(c, user, certCode, null, null, null);
                    uc = new UserCertificate(user, c, LocalDateTime.now(), certCode);
                    uc.setGeneratedDocument(renderedDoc);
                    userCertificateRepo.save(uc);
                    userCertMap.put(c.getId(), uc);

                    activityService.logActivity(
                            user,
                            "Certificate Unlocked",
                            "Unlocked the '" + c.getName() + "' Certificate (" + c.getTarget() + " " + formatMetricLabel(c.getAchievementType()) + ")!"
                    );

                    // Dashboard in-app notification
                    try {
                        if (notificationService != null) {
                            notificationService.createNotification(
                                    user,
                                    "🏆 New Certificate Unlocked",
                                    "You have earned the " + (c.getCategory() != null ? c.getCategory() : "Coding Milestone") + " certificate for " + c.getName() + ".",
                                    "CERTIFICATE",
                                    "/certificates"
                            );
                        }
                    } catch (Exception ignored) {}

                    // Dispatch milestone achievement email with direct download link (duplicate protected via notificationEventRepo)
                    try {
                        if (emailService != null) {
                            emailService.sendCertificateUnlockedEmail(
                                    user.getId(),
                                    user.getEmail(),
                                    user.getName() != null ? user.getName() : user.getUsername(),
                                    c.getCategory() != null ? c.getCategory() : "Coding Milestone",
                                    c.getName() + " (" + c.getTarget() + " " + formatMetricLabel(c.getAchievementType()) + ")",
                                    c.getName(),
                                    certCode,
                                    c.getId()
                            );
                        }
                    } catch (Exception ignored) {}
                }
            } else {
                if (uc != null) {
                    userCertificateRepo.delete(uc);
                    uc = null;
                    userCertMap.remove(c.getId());
                }
            }

            CertificateDto dto = mapToDto(c);
            dto.setCurrentProgress((int) currentMetricValue);
            dto.setUnlocked(isEligible);
            dto.setDownloadable(isEligible);

            if (isEligible && uc != null) {
                dto.setUnlockedAt(uc.getUnlockedAt());
                dto.setCertificateId(uc.getCertificateCode());
            } else {
                dto.setUnlockedAt(null);
                dto.setCertificateId(generateCertificateCode(user, c));
            }
            dtos.add(dto);
        }

        // Add any unlocked Contest Rank 1 Certificates for this user
        for (UserCertificate uc : userCerts) {
            if ("CONTEST".equalsIgnoreCase(uc.getCategory()) || uc.getContest() != null || (uc.getCertificate() != null && "CONTEST".equalsIgnoreCase(uc.getCertificate().getCategory()))) {
                Certificate c = uc.getCertificate();
                CertificateDto dto = (c != null) ? mapToDto(c) : new CertificateDto();
                if (c != null) {
                    dto.setId(c.getId());
                    dto.setName(c.getName());
                    dto.setDescription(c.getDescription());
                    dto.setTemplateStyle(c.getTemplateStyle() != null ? c.getTemplateStyle() : "ELITE");
                    dto.setTemplateDocument(c.getTemplateDocument());
                } else {
                    dto.setName("Contest Champion Certificate");
                    dto.setDescription("Awarded for securing 1st Rank in KODIFY Contest");
                    dto.setTemplateStyle("ELITE");
                }
                dto.setCategory("CONTEST");
                dto.setContestId(uc.getContest() != null ? uc.getContest().getId() : (c != null && c.getContest() != null ? c.getContest().getId() : null));
                dto.setContestTitle(uc.getContestTitle() != null ? uc.getContestTitle() : (c != null && c.getContestTitle() != null ? c.getContestTitle() : "KODIFY Contest"));
                dto.setContestDate(uc.getContestDate() != null ? uc.getContestDate() : (c != null && c.getContestDate() != null ? c.getContestDate() : uc.getUnlockedAt()));
                dto.setRank(uc.getRank() != null ? uc.getRank() : 1);
                dto.setUnlocked(true);
                dto.setDownloadable(true);
                dto.setCurrentProgress(1);
                dto.setTarget(1);
                dto.setUnlockedAt(uc.getUnlockedAt());
                dto.setCertificateId(uc.getCertificateCode() != null ? uc.getCertificateCode() : generateCertificateCode(user, c));
                dtos.add(dto);
            }
        }

        return dtos;
    }

    @Transactional
    public UserCertificate issueContestRank1Certificate(User winner, infosys.onlinecodeplate.entity.Contest contest, int score, int problemsSolved) {
        if (winner == null || contest == null) return null;

        // Check if already issued
        Optional<UserCertificate> existingUc = userCertificateRepo.findByUserIdAndContestId(winner.getId(), contest.getId());
        if (existingUc.isPresent()) {
            return existingUc.get();
        }

        // Find or create Certificate entity for this contest
        String certName = "1st Rank: " + contest.getTitle();
        Certificate cert = certificateRepo.findByContestId(contest.getId())
                .orElseGet(() -> {
                    Optional<Certificate> byName = certificateRepo.findByNameIgnoreCase(certName);
                    if (byName.isPresent()) {
                        Certificate c = byName.get();
                        c.setContest(contest);
                        c.setContestTitle(contest.getTitle());
                        c.setContestDate(contest.getStartTime());
                        c.setRank(1);
                        c.setCategory("CONTEST");
                        return certificateRepo.save(c);
                    }
                    Certificate c = new Certificate();
                    c.setName(certName);
                    c.setDescription("Awarded for securing 1st Rank in '" + contest.getTitle() + "' on KODIFY.");
                    c.setAchievementType("CONTEST_RANK_1");
                    c.setCategory("CONTEST");
                    c.setContest(contest);
                    c.setContestTitle(contest.getTitle());
                    c.setContestDate(contest.getStartTime());
                    c.setRank(1);
                    c.setTarget(1);
                    c.setEnabled(true);
                    c.setTemplateStyle("ELITE");
                    return certificateRepo.save(c);
                });

        String certCode = "KODIFY-CONTEST-" + contest.getId() + "-" + winner.getId() + "-" + (10000 + Math.abs((winner.getUsername() + contest.getTitle()).hashCode() % 90000));
        String renderedDoc = renderDocumentTemplate(cert, winner, certCode, 1, contest.getTitle(), contest.getStartTime());

        UserCertificate userCert = new UserCertificate(winner, cert, contest, 1, LocalDateTime.now(), certCode);
        userCert.setGeneratedDocument(renderedDoc);
        userCert = userCertificateRepo.save(userCert);

        // Log Activity
        try {
            activityService.logActivity(
                    winner,
                    "Contest Certificate Unlocked",
                    "Secured 1st Rank in '" + contest.getTitle() + "' and earned a Contest Achievement Certificate!"
            );
        } catch (Exception ignored) {}

        // Dashboard in-app notification
        try {
            if (notificationService != null) {
                notificationService.createNotification(
                        winner,
                        "🏆 New Certificate Unlocked",
                        "Congratulations! You secured 1st Rank in '" + contest.getTitle() + "' and earned a Contest Achievement Certificate.",
                        "CERTIFICATE",
                        "/certificates"
                );
            }
        } catch (Exception ignored) {}

        // Send Certificate Email with direct download link
        try {
            if (emailService != null && winner.getEmail() != null) {
                emailService.sendCertificateUnlockedEmail(
                        winner.getId(),
                        winner.getEmail(),
                        winner.getName() != null ? winner.getName() : winner.getUsername(),
                        "Contest Achievement",
                        "1st Rank in " + contest.getTitle(),
                        contest.getTitle(),
                        certCode,
                        cert.getId()
                );
            }
        } catch (Exception ignored) {}

        return userCert;
    }

    @Transactional(readOnly = true)
    public List<CertificateDto> getAllCertificatesForAdmin() {
        List<Certificate> certs = certificateRepo.findAllByOrderByTargetAsc();
        return certs.stream().map(c -> {
            CertificateDto dto = mapToDto(c);
            dto.setUnlockedCount(userCertificateRepo.countByCertificateId(c.getId()));
            return dto;
        }).collect(Collectors.toList());
    }

    @Transactional
    public CertificateDto createCertificate(CertificateRequestDto req) {
        if (certificateRepo.existsByNameIgnoreCase(req.getName().trim())) {
            throw new RuntimeException("A certificate with name '" + req.getName().trim() + "' already exists.");
        }

        String template = normalizeTemplateStyle(req.getTemplateStyle());
        String category = (req.getCategory() != null && !req.getCategory().isBlank()) ? req.getCategory().trim().toUpperCase() : "CODING_MILESTONE";

        Certificate c = new Certificate(
                req.getName().trim(),
                req.getDescription() != null ? req.getDescription().trim() : "",
                req.getAchievementType() != null ? req.getAchievementType().trim().toUpperCase() : "PROBLEMS_SOLVED",
                req.getTarget() != null ? req.getTarget() : 5,
                req.getEnabled() != null ? req.getEnabled() : true
        );
        c.setTemplateStyle(template);
        c.setCategory(category);
        c.setTemplateDocument(req.getTemplateDocument());

        c = certificateRepo.save(c);
        return mapToDto(c);
    }

    @Transactional
    public CertificateDto updateCertificate(Long id, CertificateRequestDto req) {
        Certificate c = certificateRepo.findById(id).orElseThrow(() -> new RuntimeException("Certificate not found."));

        if (!c.getName().equalsIgnoreCase(req.getName().trim())) {
            if (certificateRepo.existsByNameIgnoreCase(req.getName().trim())) {
                throw new RuntimeException("A certificate with name '" + req.getName().trim() + "' already exists.");
            }
            c.setName(req.getName().trim());
        }

        String template = normalizeTemplateStyle(req.getTemplateStyle());
        String category = (req.getCategory() != null && !req.getCategory().isBlank()) ? req.getCategory().trim().toUpperCase() : (c.getCategory() != null ? c.getCategory() : "CODING_MILESTONE");

        c.setDescription(req.getDescription() != null ? req.getDescription().trim() : "");
        c.setAchievementType(req.getAchievementType() != null ? req.getAchievementType().trim().toUpperCase() : "PROBLEMS_SOLVED");
        c.setTarget(req.getTarget() != null ? req.getTarget() : 5);
        c.setEnabled(req.getEnabled() != null ? req.getEnabled() : true);
        c.setTemplateStyle(template);
        c.setCategory(category);
        if (req.getTemplateDocument() != null) {
            c.setTemplateDocument(req.getTemplateDocument());
        }

        c = certificateRepo.save(c);
        CertificateDto dto = mapToDto(c);
        dto.setUnlockedCount(userCertificateRepo.countByCertificateId(c.getId()));
        return dto;
    }

    @Transactional
    public void deleteCertificate(Long id) {
        if (!certificateRepo.existsById(id)) {
            throw new RuntimeException("Certificate not found.");
        }
        userCertificateRepo.deleteByCertificateId(id);
        certificateRepo.deleteById(id);
    }

    @Transactional(readOnly = true)
    public CertificateStatusDto getCertificateStatus(User user) {
        List<CertificateDto> certs = getAllCertificatesForUser(user);
        if (certs.isEmpty()) {
            long uniqueSolved = user != null ? achievementService.countUniqueSolvedProblems(user.getId()) : 0;
            return new CertificateStatusDto(false, (int) uniqueSolved, 50, user != null ? user.getName() : "User", user != null ? user.getEmail() : "", LocalDate.now().toString(), "KODIFY-CERT");
        }
        CertificateDto targetCert = certs.stream().filter(CertificateDto::isUnlocked).reduce((first, second) -> second).orElse(certs.get(0));
        return new CertificateStatusDto(
                targetCert.isUnlocked(),
                targetCert.getCurrentProgress(),
                targetCert.getTarget(),
                user.getName(),
                user.getEmail(),
                LocalDate.now().format(DateTimeFormatter.ofPattern("MMMM d, yyyy")),
                targetCert.getCertificateId()
        );
    }

    @Transactional(readOnly = true)
    public byte[] generateCertificatePdf(User user) {
        List<CertificateDto> certs = getAllCertificatesForUser(user);
        CertificateDto unlockedCert = certs.stream()
                .filter(CertificateDto::isUnlocked)
                .reduce((first, second) -> second)
                .orElse(null);

        if (unlockedCert == null) {
            long uniqueSolved = achievementService.countUniqueSolvedProblems(user.getId());
            int required = certs.isEmpty() ? 50 : certs.get(0).getTarget();
            throw new RuntimeException("Certificate is locked. You have solved " + uniqueSolved + " of " + required + " required problems.");
        }

        Certificate certEntity = certificateRepo.findById(unlockedCert.getId()).orElse(null);
        return generatePdfDocument(user, certEntity, unlockedCert);
    }

    @Transactional(readOnly = true)
    public byte[] generateCertificatePdf(User user, Long certificateId) {
        Certificate cert = certificateRepo.findById(certificateId)
                .orElseThrow(() -> new RuntimeException("Certificate not found."));

        boolean isContest = "CONTEST".equalsIgnoreCase(cert.getCategory())
                || "CONTEST_RANK_1".equalsIgnoreCase(cert.getAchievementType())
                || cert.getContest() != null;

        if (isContest) {
            boolean hasUnlocked = userCertificateRepo.existsByUserIdAndCertificateId(user.getId(), certificateId)
                    || (cert.getContest() != null && userCertificateRepo.existsByUserIdAndContestId(user.getId(), cert.getContest().getId()));
            if (!hasUnlocked) {
                throw new RuntimeException("Contest certificate is locked. You must secure 1st Rank in this contest to unlock it.");
            }
        } else {
            long uniqueSolved = achievementService.countUniqueSolvedProblems(user.getId());
            UserContestStatsDto contestStats = achievementService.getUserContestStats(user.getId());
            long currentMetricValue = getMetricValue(cert.getAchievementType(), uniqueSolved, contestStats);

            if (currentMetricValue < cert.getTarget()) {
                throw new RuntimeException("Certificate '" + cert.getName() + "' is locked. You have completed " + currentMetricValue + " of " + cert.getTarget() + " required " + formatMetricLabel(cert.getAchievementType()) + ".");
            }
        }

        CertificateDto dto = mapToDto(cert);
        Optional<UserCertificate> ucOpt = userCertificateRepo.findByUserIdAndCertificateId(user.getId(), certificateId);
        if (ucOpt.isPresent()) {
            dto.setCertificateId(ucOpt.get().getCertificateCode());
            dto.setUnlockedAt(ucOpt.get().getUnlockedAt());
        } else {
            dto.setCertificateId(generateCertificateCode(user, cert));
        }
        return generatePdfDocument(user, cert, dto);
    }

    private byte[] generatePdfDocument(User user, Certificate cert, CertificateDto dto) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            // A4 Landscape: 842 x 595
            Document document = new Document(PageSize.A4.rotate(), 32, 32, 28, 28);
            PdfWriter writer = PdfWriter.getInstance(document, out);
            document.open();

            PdfContentByte cb = writer.getDirectContent();

            float width = PageSize.A4.rotate().getWidth();   // 842f
            float height = PageSize.A4.rotate().getHeight(); // 595f

            String templateStyle = normalizeTemplateStyle(cert != null ? cert.getTemplateStyle() : (dto != null ? dto.getTemplateStyle() : "STANDARD"));

            // Core Palette
            Color ivoryBg = new Color(251, 250, 244);       // #FBFAF4 Warm Ivory
            Color darkNavy = new Color(0, 78, 100);          // #004E64 Primary Dark Navy/Teal
            Color headerDark = new Color(7, 43, 56);         // #072B38 Deep Title Navy
            Color gold = new Color(184, 135, 39);            // #B88727 Academic Gold
            Color lightGold = new Color(213, 166, 58);       // #D5A63A Pinstripe Gold
            Color innerTeal = new Color(0, 129, 167);        // #0081A7 Accent Teal
            Color bodySlate = new Color(51, 65, 85);         // #334155 Citation Charcoal
            Color mutedGray = new Color(100, 116, 139);      // #64748B Metadata
            Color verifiedGreen = new Color(21, 128, 61);    // #15803D Verified Green

            // 1. Warm Ivory Canvas Background
            cb.setColorFill(ivoryBg);
            cb.rectangle(0, 0, width, height);
            cb.fill();

            // 2. Multi-layer Certificate Outer Borders (4 Layers from Outside to Inside)
            // Layer 1: Outer dark blue/teal frame
            cb.setColorStroke(darkNavy);
            cb.setLineWidth(1.5f);
            cb.rectangle(16, 16, width - 32, height - 32);
            cb.stroke();

            // Layer 2: Thick 8px gold border (primary premium accent)
            cb.setColorStroke(gold);
            cb.setLineWidth(8.0f);
            cb.rectangle(23, 23, width - 46, height - 46);
            cb.stroke();

            // Layer 3: Teal 3px border
            cb.setColorStroke(darkNavy);
            cb.setLineWidth(3.0f);
            cb.rectangle(30, 30, width - 60, height - 60);
            cb.stroke();

            // Layer 4: Thin gold inner accent pinstripe border
            cb.setColorStroke(lightGold);
            cb.setLineWidth(1.5f);
            cb.rectangle(35, 35, width - 70, height - 70);
            cb.stroke();

            // 3. Four Decorative Geometric Corner Flourishes
            drawAcademicCornerFlourish(cb, 33, 33, 1, 1, gold, darkNavy);
            drawAcademicCornerFlourish(cb, width - 33, 33, -1, 1, gold, darkNavy);
            drawAcademicCornerFlourish(cb, 33, height - 33, 1, -1, gold, darkNavy);
            drawAcademicCornerFlourish(cb, width - 33, height - 33, -1, -1, gold, darkNavy);

            // 4. Subtle Banyan Tree Watermark (Center Background)
            drawBanyanWatermark(cb, width / 2, height / 2 - 10, darkNavy);

            // 5. Achievement Seal Badge in Upper Right
            String sealTop = "ELITE".equalsIgnoreCase(templateStyle) ? "ELITE" : ("ADVANCED".equalsIgnoreCase(templateStyle) ? "SKILLED" : "VERIFIED");
            String sealBottom = "ELITE".equalsIgnoreCase(templateStyle) ? "ACHIEVER" : ("ADVANCED".equalsIgnoreCase(templateStyle) ? "LEARNER" : "STUDENT");
            drawAchievementSealBadge(cb, width - 82, height - 82, sealTop, sealBottom, gold, darkNavy, ivoryBg);

            // 6. Typography Definitions
            Font brandFont = FontFactory.getFont(FontFactory.TIMES_BOLD, 22, darkNavy);
            Font brandMottoFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8.5f, gold);
            Font titleMainFont = FontFactory.getFont(FontFactory.TIMES_BOLD, 26, headerDark);
            Font titleSubFont = FontFactory.getFont(FontFactory.TIMES_BOLD, 12.5f, gold);
            Font dividerFont = FontFactory.getFont(FontFactory.TIMES_BOLD, 10, lightGold);
            Font presentedFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9.5f, mutedGray);
            Font recipientNameFont = FontFactory.getFont(FontFactory.TIMES_BOLD, 24, darkNavy);
            Font bodyCitationFont = FontFactory.getFont(FontFactory.HELVETICA, 10.5f, bodySlate);
            Font boldHighlightFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10.5f, darkNavy);
            Font metaLabelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 7.5f, mutedGray);
            Font metaValueFont = FontFactory.getFont(FontFactory.TIMES_BOLD, 10.5f, headerDark);
            Font certIdFont = FontFactory.getFont(FontFactory.COURIER_BOLD, 8.0f, mutedGray);
            Font verifiedBadgeFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8.5f, verifiedGreen);
            Font previewBadgeFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8.5f, mutedGray);
            Font authoritySigFont = FontFactory.getFont(FontFactory.TIMES_BOLD, 11.5f, darkNavy);
            Font bottomMottoFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8.0f, gold);

            // 7. Main Content Flow Table
            PdfPTable mainTable = new PdfPTable(1);
            mainTable.setWidthPercentage(88);
            mainTable.getDefaultCell().setBorder(Rectangle.NO_BORDER);
            mainTable.getDefaultCell().setHorizontalAlignment(Element.ALIGN_CENTER);

            addEmptyParagraph(mainTable, 14);

            // Section 1: KODIFY Branding
            Paragraph brandPara = new Paragraph();
            brandPara.setAlignment(Element.ALIGN_CENTER);
            brandPara.setLeading(20);
            brandPara.add(new Chunk("<  ", dividerFont));
            brandPara.add(new Chunk("K O D I F Y", brandFont));
            brandPara.add(new Chunk("  />", dividerFont));
            mainTable.addCell(createCell(brandPara));

            Paragraph mottoPara = new Paragraph("L E A R N   \u2022   P R A C T I C E   \u2022   B U I L D", brandMottoFont);
            mottoPara.setAlignment(Element.ALIGN_CENTER);
            mottoPara.setLeading(12);
            mainTable.addCell(createCell(mottoPara));

            addEmptyParagraph(mainTable, 12);

            // Section 2: Main Heading
            Paragraph certMainHeading = new Paragraph("CERTIFICATE", titleMainFont);
            certMainHeading.setAlignment(Element.ALIGN_CENTER);
            certMainHeading.setLeading(25);
            mainTable.addCell(createCell(certMainHeading));

            Paragraph certSubHeading = new Paragraph("OF ACHIEVEMENT", titleSubFont);
            certSubHeading.setAlignment(Element.ALIGN_CENTER);
            certSubHeading.setLeading(14);
            mainTable.addCell(createCell(certSubHeading));

            Paragraph dividerPara = new Paragraph("\u2014\u2014  \u25C6  \u2014\u2014", dividerFont);
            dividerPara.setAlignment(Element.ALIGN_CENTER);
            dividerPara.setLeading(11);
            mainTable.addCell(createCell(dividerPara));

            addEmptyParagraph(mainTable, 12);

            // Section 3: Recipient Section
            Paragraph presPara = new Paragraph("THIS IS PROUDLY PRESENTED TO", presentedFont);
            presPara.setAlignment(Element.ALIGN_CENTER);
            presPara.setLeading(12);
            mainTable.addCell(createCell(presPara));

            addEmptyParagraph(mainTable, 6);

            String studentName = (user.getName() != null && !user.getName().isBlank())
                    ? user.getName().trim().toUpperCase()
                    : (user.getUsername() != null ? user.getUsername().trim().toUpperCase() : "STUDENT NAME");

            Paragraph namePara = new Paragraph(studentName, recipientNameFont);
            namePara.setAlignment(Element.ALIGN_CENTER);
            namePara.setLeading(23);
            mainTable.addCell(createCell(namePara));

            // Gold Underline beneath name
            Paragraph underlinePara = new Paragraph("\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014", dividerFont);
            underlinePara.setAlignment(Element.ALIGN_CENTER);
            underlinePara.setLeading(7);
            mainTable.addCell(createCell(underlinePara));

            addEmptyParagraph(mainTable, 12);

            // Section 4: Citation & Description
            Paragraph textPara = new Paragraph();
            textPara.setAlignment(Element.ALIGN_CENTER);
            textPara.setLeading(16);

            boolean isContest = (cert != null && ("CONTEST".equalsIgnoreCase(cert.getCategory()) || "CONTEST_RANK_1".equalsIgnoreCase(cert.getAchievementType()) || cert.getContest() != null))
                    || (dto != null && "CONTEST".equalsIgnoreCase(dto.getCategory()));

            if (isContest) {
                String contestName = (cert != null && cert.getContestTitle() != null && !cert.getContestTitle().isBlank())
                        ? cert.getContestTitle()
                        : ((dto != null && dto.getContestTitle() != null && !dto.getContestTitle().isBlank()) ? dto.getContestTitle() : (cert != null ? cert.getName() : "KODIFY Contest"));

                LocalDateTime cDate = (cert != null && cert.getContestDate() != null)
                        ? cert.getContestDate()
                        : ((dto != null && dto.getContestDate() != null) ? dto.getContestDate() : LocalDateTime.now());

                String contestDateStr = cDate.format(DateTimeFormatter.ofPattern("MMMM d, yyyy"));

                textPara.add(new Chunk("For securing ", bodyCitationFont));
                textPara.add(new Chunk("1st Rank", boldHighlightFont));
                textPara.add(new Chunk(" in ", bodyCitationFont));
                textPara.add(new Chunk(contestName.toUpperCase() + "\n", boldHighlightFont));
                textPara.add(new Chunk("For exemplary algorithmic performance, technical mastery, and competitive excellence in the KODIFY Grand Arena on " + contestDateStr + ".", bodyCitationFont));
            } else {
                int targetCount = cert != null ? cert.getTarget() : (dto != null ? dto.getTarget() : 5);
                String desc = (cert != null && cert.getDescription() != null && !cert.getDescription().isBlank())
                        ? cert.getDescription()
                        : "For outstanding dedication and technical excellence in completing all " + targetCount + " milestone challenges on the KODIFY platform.";

                textPara.add(new Chunk(desc, bodyCitationFont));
            }

            mainTable.addCell(createCell(textPara));

            addEmptyParagraph(mainTable, 20);

            // Section 5: 3-Column Footer (Date of Issue | Verification & ID | Authority)
            PdfPTable footerTable = new PdfPTable(3);
            footerTable.setWidthPercentage(98);
            footerTable.setWidths(new float[]{32, 36, 32});

            // Footer Left: Date of Issue
            LocalDateTime issueLdt = (dto != null && dto.getUnlockedAt() != null) ? dto.getUnlockedAt() : LocalDateTime.now();
            String issueDateStr = issueLdt.format(DateTimeFormatter.ofPattern("MMMM d, yyyy"));

            Paragraph datePara = new Paragraph();
            datePara.setLeading(13);
            datePara.add(new Chunk("DATE OF ISSUE\n", metaLabelFont));
            datePara.add(new Chunk(issueDateStr, metaValueFont));
            datePara.setAlignment(Element.ALIGN_LEFT);
            PdfPCell dateCell = new PdfPCell(datePara);
            dateCell.setBorder(Rectangle.NO_BORDER);
            dateCell.setHorizontalAlignment(Element.ALIGN_LEFT);
            footerTable.addCell(dateCell);

            // Footer Center: Verification Status Pill & Certificate ID
            boolean isCertUnlocked = (dto != null && dto.isUnlocked()) || (cert != null && userCertificateRepo.existsByUserIdAndCertificateId(user.getId(), cert.getId()));
            String certIdStr = (dto != null && dto.getCertificateId() != null) ? dto.getCertificateId() : generateCertificateCode(user, cert);

            Paragraph sealCenterPara = new Paragraph();
            sealCenterPara.setLeading(13);
            sealCenterPara.setAlignment(Element.ALIGN_CENTER);
            if (isCertUnlocked) {
                sealCenterPara.add(new Chunk("[ \u2713 VERIFIED ]\n", verifiedBadgeFont));
            } else {
                sealCenterPara.add(new Chunk("[ PREVIEW ]\n", previewBadgeFont));
            }
            sealCenterPara.add(new Chunk("ID: " + certIdStr, certIdFont));
            PdfPCell sealCenterCell = new PdfPCell(sealCenterPara);
            sealCenterCell.setBorder(Rectangle.NO_BORDER);
            sealCenterCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            footerTable.addCell(sealCenterCell);

            // Footer Right: Authority Signature
            Paragraph authPara = new Paragraph();
            authPara.setLeading(13);
            authPara.setAlignment(Element.ALIGN_RIGHT);
            authPara.add(new Chunk("Kodify Academic Board\n", authoritySigFont));
            authPara.add(new Chunk("AUTHORIZED VERIFICATION", metaLabelFont));
            PdfPCell authCell = new PdfPCell(authPara);
            authCell.setBorder(Rectangle.NO_BORDER);
            authCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            footerTable.addCell(authCell);

            PdfPCell footerCell = new PdfPCell(footerTable);
            footerCell.setBorder(Rectangle.NO_BORDER);
            mainTable.addCell(footerCell);

            addEmptyParagraph(mainTable, 12);

            // Section 6: Bottom Motto
            Paragraph bottomMotto = new Paragraph("\u2014   C O D E   T O D A Y   \u2022   C R E A T E   T O M O R R O W   \u2014", bottomMottoFont);
            bottomMotto.setAlignment(Element.ALIGN_CENTER);
            bottomMotto.setLeading(11);
            mainTable.addCell(createCell(bottomMotto));

            document.add(mainTable);
            document.close();

            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PDF certificate: " + e.getMessage(), e);
        }
    }

    private PdfPCell createCell(Paragraph p) {
        PdfPCell cell = new PdfPCell(p);
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        return cell;
    }

    private void addEmptyParagraph(PdfPTable table, float spacing) {
        Paragraph empty = new Paragraph(" ");
        empty.setLeading(spacing);
        PdfPCell cell = new PdfPCell(empty);
        cell.setBorder(Rectangle.NO_BORDER);
        table.addCell(cell);
    }

    private void drawAcademicCornerFlourish(PdfContentByte cb, float x, float y, float dx, float dy, Color gold, Color navy) {
        cb.saveState();
        // Corner bracket lines
        cb.setColorStroke(gold);
        cb.setLineWidth(1.5f);
        cb.moveTo(x, y + 22 * dy);
        cb.lineTo(x, y);
        cb.lineTo(x + 22 * dx, y);
        cb.stroke();

        // Inner navy bracket
        cb.setColorStroke(navy);
        cb.setLineWidth(0.8f);
        cb.moveTo(x + 3 * dx, y + 18 * dy);
        cb.lineTo(x + 3 * dx, y + 3 * dy);
        cb.lineTo(x + 18 * dx, y + 3 * dy);
        cb.stroke();

        // Corner diamond
        cb.setColorFill(gold);
        float cx = x + 10 * dx;
        float cy = y + 10 * dy;
        cb.moveTo(cx, cy + 3.5f * dy);
        cb.lineTo(cx + 3.5f * dx, cy);
        cb.lineTo(cx, cy - 3.5f * dy);
        cb.lineTo(cx - 3.5f * dx, cy);
        cb.closePath();
        cb.fill();

        // Small navy center dot
        cb.setColorFill(navy);
        cb.circle(cx, cy, 1.2f);
        cb.fill();
        cb.restoreState();
    }

    private void drawBanyanWatermark(PdfContentByte cb, float cx, float cy, Color navy) {
        cb.saveState();
        try {
            PdfGState gstate = new PdfGState();
            gstate.setFillOpacity(0.045f);
            gstate.setStrokeOpacity(0.045f);
            cb.setGState(gstate);

            cb.setColorStroke(navy);
            cb.setColorFill(navy);

            // Concentric faint ornamental rings
            cb.setLineWidth(1.5f);
            cb.circle(cx, cy, 80);
            cb.stroke();
            cb.setLineWidth(0.8f);
            cb.circle(cx, cy, 105);
            cb.stroke();

            // Stylized central trunk and root arcs
            cb.setLineWidth(2.0f);
            cb.moveTo(cx, cy - 50);
            cb.lineTo(cx, cy + 10);
            cb.moveTo(cx, cy - 50);
            cb.curveTo(cx - 20, cy - 30, cx - 35, cy - 10, cx - 45, cy + 5);
            cb.moveTo(cx, cy - 50);
            cb.curveTo(cx + 20, cy - 30, cx + 35, cy - 10, cx + 45, cy + 5);
            cb.stroke();

            // Canopy arcs and foliage clusters
            cb.circle(cx, cy + 35, 24);
            cb.fill();
            cb.circle(cx - 45, cy + 20, 20);
            cb.fill();
            cb.circle(cx + 45, cy + 20, 20);
            cb.fill();
        } finally {
            cb.restoreState();
        }
    }

    private void drawAchievementSealBadge(PdfContentByte cb, float cx, float cy, String topText, String bottomText, Color gold, Color navy, Color ivory) {
        cb.saveState();

        // 1. Ribbon tails beneath seal
        cb.setColorFill(gold);
        // Left tail
        cb.moveTo(cx - 10, cy - 18);
        cb.lineTo(cx - 18, cy - 38);
        cb.lineTo(cx - 10, cy - 34);
        cb.lineTo(cx - 2, cy - 38);
        cb.lineTo(cx - 4, cy - 18);
        cb.closePath();
        cb.fill();

        // Right tail
        cb.moveTo(cx + 4, cy - 18);
        cb.lineTo(cx + 2, cy - 38);
        cb.lineTo(cx + 10, cy - 34);
        cb.lineTo(cx + 18, cy - 38);
        cb.lineTo(cx + 10, cy - 18);
        cb.closePath();
        cb.fill();

        // 2. Outer gold circle
        cb.setColorFill(ivory);
        cb.setColorStroke(gold);
        cb.setLineWidth(2.0f);
        cb.circle(cx, cy, 26);
        cb.fillStroke();

        // 3. Dashed gold perimeter ring
        cb.setColorStroke(gold);
        cb.setLineWidth(0.8f);
        cb.circle(cx, cy, 23);
        cb.stroke();

        // 4. Inner navy ring
        cb.setColorStroke(navy);
        cb.setLineWidth(1.0f);
        cb.circle(cx, cy, 20.5f);
        cb.stroke();

        // 5. Seal Texts
        Font sealFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 5.5f, navy);
        Font starFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8.0f, gold);
        Font sealSubFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 5.0f, gold);

        cb.beginText();
        cb.setFontAndSize(sealFont.getBaseFont(), 5.5f);
        cb.setColorFill(navy);
        cb.showTextAligned(Element.ALIGN_CENTER, topText, cx, cy + 7, 0);

        cb.setFontAndSize(starFont.getBaseFont(), 8.0f);
        cb.setColorFill(gold);
        cb.showTextAligned(Element.ALIGN_CENTER, "\u2605", cx, cy - 2, 0);

        cb.setFontAndSize(sealSubFont.getBaseFont(), 5.0f);
        cb.setColorFill(gold);
        cb.showTextAligned(Element.ALIGN_CENTER, bottomText, cx, cy - 10, 0);
        cb.endText();

        cb.restoreState();
    }



    private String normalizeTemplateStyle(String style) {
        if (style == null || style.isBlank()) return "STANDARD";
        String s = style.trim().toUpperCase();
        if (s.contains("ELITE") || s.contains("PLATINUM") || s.contains("LEVEL 3") || s.contains("LEVEL3")) return "ELITE";
        if (s.contains("ADVANCED") || s.contains("GOLD") || s.contains("LEVEL 2") || s.contains("LEVEL2")) return "ADVANCED";
        return "STANDARD";
    }

    private String generateCertificateCode(User user, Certificate c) {
        if (user == null) return "KODIFY-CERT";
        String base = "KODIFY-" + (c != null ? c.getId() : "1") + "-" + user.getId() + "-" + (user.getUsername() != null ? user.getUsername().toUpperCase() : "USER");
        int hash = Math.abs(base.hashCode() % 90000) + 10000;
        return "KODIFY-CERT-" + (c != null ? c.getId() : "1") + "-" + user.getId() + "-" + hash;
    }

    private long getMetricValue(String achievementType, long uniqueSolved, UserContestStatsDto contestStats) {
        if (achievementType == null) return uniqueSolved;
        switch (achievementType.toUpperCase()) {
            case "PROBLEMS_SOLVED":
                return uniqueSolved;
            case "CONTESTS_PARTICIPATED":
                return contestStats.getParticipatedCount();
            case "CONTESTS_CONDUCTED":
                return contestStats.getConductedCount();
            case "CONTEST_WINS":
            case "CONTEST_RANK_1":
            case "CONTEST":
                return contestStats.getWinsCount();
            default:
                return uniqueSolved;
        }
    }

    private String formatMetricLabel(String achievementType) {
        if (achievementType == null) return "Unique Problems Solved";
        switch (achievementType.toUpperCase()) {
            case "PROBLEMS_SOLVED":
                return "Unique Problems Solved";
            case "CONTESTS_PARTICIPATED":
                return "Contests Participated";
            case "CONTESTS_CONDUCTED":
                return "Contests Conducted";
            case "CONTEST_WINS":
            case "CONTEST_RANK_1":
            case "CONTEST":
                return "Contest Victories";
            default:
                return "Challenges Completed";
        }
    }

    public String renderDocumentTemplate(Certificate cert, User user, String certCode, Integer rank, String contestName, LocalDateTime contestDate) {
        String template = (cert != null && cert.getTemplateDocument() != null && !cert.getTemplateDocument().isBlank())
                ? cert.getTemplateDocument()
                : getDefaultTemplate(cert != null ? cert.getCategory() : "CODING_MILESTONE");

        String userName = (user != null && user.getName() != null && !user.getName().isBlank())
                ? user.getName()
                : (user != null ? user.getUsername() : "Student");

        String category = cert != null && cert.getCategory() != null ? cert.getCategory() : "CODING_MILESTONE";
        String milestone = cert != null ? (cert.getTarget() + " " + formatMetricLabel(cert.getAchievementType())) : "Milestone Achievement";
        String achievement = cert != null ? cert.getName() : "Excellence in Programming";
        String rankStr = rank != null ? (rank == 1 ? "1st Rank" : rank == 2 ? "2nd Rank" : rank == 3 ? "3rd Rank" : "Rank " + rank) : "N/A";
        String contest = contestName != null ? contestName : (cert != null && cert.getContestTitle() != null ? cert.getContestTitle() : "KODIFY Arena");
        String dateStr = (contestDate != null ? contestDate : LocalDateTime.now()).format(DateTimeFormatter.ofPattern("MMMM d, yyyy"));
        String org = "KODIFY Online Evaluation & Learning Platform";
        String code = certCode != null ? certCode : "KODIFY-CERT";

        return template
                .replace("{{NAME}}", userName)
                .replace("{{CATEGORY}}", category.replace("_", " "))
                .replace("{{MILESTONE}}", milestone)
                .replace("{{ACHIEVEMENT}}", achievement)
                .replace("{{RANK}}", rankStr)
                .replace("{{CONTEST_NAME}}", contest)
                .replace("{{DATE}}", dateStr)
                .replace("{{ORGANIZATION}}", org)
                .replace("{{CERTIFICATE_CODE}}", code);
    }

    public static String getDefaultTemplate(String category) {
        if ("CONTEST".equalsIgnoreCase(category)) {
            return "========================================================\n"
                    + "                   K O D I F Y\n"
                    + "         CONTEST ACHIEVEMENT CERTIFICATE\n"
                    + "========================================================\n"
                    + "This is proudly presented to:\n"
                    + "                   {{NAME}}\n\n"
                    + "For outstanding algorithmic mastery and securing\n"
                    + "                   {{RANK}}\n"
                    + "in the national coding contest:\n"
                    + "               {{CONTEST_NAME}}\n\n"
                    + "Category: {{CATEGORY}}\n"
                    + "Date Issued: {{DATE}}\n"
                    + "Certificate Verification Code: {{CERTIFICATE_CODE}}\n"
                    + "Issued by: {{ORGANIZATION}}\n"
                    + "========================================================";
        }
        return "========================================================\n"
                + "                   K O D I F Y\n"
                + "       OFFICIAL MILESTONE CERTIFICATE\n"
                + "========================================================\n"
                + "This is proudly presented to:\n"
                + "                   {{NAME}}\n\n"
                + "For exceptional engineering dedication and completing:\n"
                + "               {{MILESTONE}}\n"
                + "Achievement Credential: {{ACHIEVEMENT}}\n\n"
                + "Category: {{CATEGORY}}\n"
                + "Date Issued: {{DATE}}\n"
                + "Certificate Verification Code: {{CERTIFICATE_CODE}}\n"
                + "Issued by: {{ORGANIZATION}}\n"
                + "========================================================";
    }

    @Transactional(readOnly = true)
    public byte[] generateCertificatePdfByCode(String code) {
        UserCertificate uc = userCertificateRepo.findByCertificateCode(code)
                .orElseThrow(() -> new RuntimeException("Certificate not found with code: " + code));

        User user = uc.getUser();
        Certificate cert = uc.getCertificate();

        CertificateDto dto = (cert != null) ? mapToDto(cert) : new CertificateDto();
        dto.setCertificateId(uc.getCertificateCode());
        dto.setUnlockedAt(uc.getUnlockedAt());
        if (uc.getContest() != null) {
            dto.setContestId(uc.getContest().getId());
            dto.setContestTitle(uc.getContestTitle());
            dto.setContestDate(uc.getContestDate());
            dto.setRank(uc.getRank());
        }

        return generatePdfDocument(user, cert, dto);
    }

    public CertificateDto mapToDto(Certificate c) {
        CertificateDto dto = new CertificateDto();
        dto.setId(c.getId());
        dto.setName(c.getName());
        dto.setDescription(c.getDescription());
        dto.setTemplateStyle(normalizeTemplateStyle(c.getTemplateStyle()));
        dto.setTemplateDocument(c.getTemplateDocument());
        dto.setAchievementType(c.getAchievementType());
        dto.setCategory(c.getCategory() != null ? c.getCategory() : "GENERAL");
        dto.setContestId(c.getContest() != null ? c.getContest().getId() : null);
        dto.setContestTitle(c.getContestTitle());
        dto.setContestDate(c.getContestDate());
        dto.setRank(c.getRank());
        dto.setTarget(c.getTarget());
        dto.setEnabled(c.getEnabled());
        dto.setCreatedAt(c.getCreatedAt());
        return dto;
    }
}
