package infosys.onlinecodeplate.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.HashSet;

@Entity
@Table(name = "problems")
public class Problem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String concept;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "problem_concepts", joinColumns = @JoinColumn(name = "problem_id"))
    @Column(name = "concept")
    private List<String> concepts = new ArrayList<>();

    @Column(nullable = false)
    private String difficulty;

    @Column(columnDefinition = "LONGTEXT", nullable = false)
    private String description;

    @Column(columnDefinition = "TEXT")
    private String constraints;

    @Column(columnDefinition = "LONGTEXT")
    private String solution;

    @Column(columnDefinition = "LONGTEXT")
    private String testCases; // Legacy string format fallback

    @Column(columnDefinition = "LONGTEXT")
    private String solutionC;

    @Column(columnDefinition = "LONGTEXT")
    private String solutionPython;

    @Column(columnDefinition = "LONGTEXT")
    private String solutionJava;

    @Column(columnDefinition = "LONGTEXT")
    private String solutionCpp;

    @Column(columnDefinition = "LONGTEXT")
    private String solutionJs;

    @Column(columnDefinition = "LONGTEXT")
    private String solutionGo;

    @Column(columnDefinition = "LONGTEXT")
    private String solutionRust;

    @Column(columnDefinition = "LONGTEXT")
    private String starterCodeC;

    @Column(columnDefinition = "LONGTEXT")
    private String starterCodePython;

    @Column(columnDefinition = "LONGTEXT")
    private String starterCodeJava;

    @Column(columnDefinition = "LONGTEXT")
    private String starterCodeCpp;

    @Column(columnDefinition = "LONGTEXT")
    private String starterCodeJs;

    @Column(columnDefinition = "LONGTEXT")
    private String starterCodeGo;

    @Column(columnDefinition = "LONGTEXT")
    private String starterCodeRust;

    @Column(columnDefinition = "LONGTEXT")
    private String editorial;

    @OneToMany(mappedBy = "problem", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<TestCase> testCasesList = new ArrayList<>();

    @OneToMany(mappedBy = "problem", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("hintOrder ASC")
    private List<ProblemHint> hintsList = new ArrayList<>();

    @Column(length = 20)
    private String questionType = "CODING"; // "CODING" or "MCQ"

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "problem_options", joinColumns = @JoinColumn(name = "problem_id"))
    @Column(name = "option_text", columnDefinition = "TEXT")
    @OrderColumn(name = "option_index")
    private List<String> options = new ArrayList<>();

    @Column(columnDefinition = "TEXT")
    private String correctOption; // "A", "B", "C", "D" or specific option text

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "problem_allowed_languages", joinColumns = @JoinColumn(name = "problem_id"))
    @Column(name = "language", length = 30)
    private Set<String> allowedLanguages = new HashSet<>();

    @Column(length = 500)
    private String imageUrl;

    private Long creatorId;

    private Boolean isPrivate = false;

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void setLastUpdate() { this.updatedAt = LocalDateTime.now(); }

    public void addTestCase(TestCase tc) {
        testCasesList.add(tc);
        tc.setProblem(this);
    }

    public void removeTestCase(TestCase tc) {
        testCasesList.remove(tc);
        tc.setProblem(null);
    }

    public void clearTestCases() {
        for (TestCase tc : new ArrayList<>(testCasesList)) {
            removeTestCase(tc);
        }
    }

    public void addHint(ProblemHint hint) {
        hintsList.add(hint);
        hint.setProblem(this);
    }

    public void removeHint(ProblemHint hint) {
        hintsList.remove(hint);
        hint.setProblem(null);
    }

    public void clearHints() {
        for (ProblemHint hint : new ArrayList<>(hintsList)) {
            removeHint(hint);
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getConcept() {
        if (concept != null && !concept.isBlank()) {
            return concept;
        }
        if (concepts != null && !concepts.isEmpty()) {
            return String.join(", ", concepts);
        }
        return "";
    }
    public void setConcept(String concept) {
        this.concept = concept;
        if (concepts == null) {
            concepts = new ArrayList<>();
        }
        if (concepts.isEmpty() && concept != null && !concept.isBlank()) {
            for (String c : concept.split(",")) {
                if (!c.trim().isEmpty()) {
                    concepts.add(c.trim());
                }
            }
        }
    }
    public List<String> getConcepts() {
        if (concepts != null && !concepts.isEmpty()) {
            return new ArrayList<>(concepts);
        }
        if (concept != null && !concept.isBlank()) {
            List<String> list = new ArrayList<>();
            for (String c : concept.split(",")) {
                if (!c.trim().isEmpty()) list.add(c.trim());
            }
            return list;
        }
        return new ArrayList<>();
    }
    public void setConcepts(List<String> newConcepts) {
        if (this.concepts == null) {
            this.concepts = new ArrayList<>();
        } else {
            this.concepts.clear();
        }
        if (newConcepts != null) {
            for (String c : newConcepts) {
                if (c != null && !c.trim().isEmpty()) {
                    this.concepts.add(c.trim());
                }
            }
        }
        if (!this.concepts.isEmpty()) {
            this.concept = String.join(", ", this.concepts);
        }
    }
    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getConstraints() { return constraints; }
    public void setConstraints(String constraints) { this.constraints = constraints; }
    public String getSolution() { return solution; }
    public void setSolution(String solution) { this.solution = solution; }
    public String getTestCases() { return testCases; }
    public void setTestCases(String testCases) { this.testCases = testCases; }
    public String getSolutionC() { return solutionC; }
    public void setSolutionC(String solutionC) { this.solutionC = solutionC; }
    public String getSolutionPython() { return solutionPython; }
    public void setSolutionPython(String solutionPython) { this.solutionPython = solutionPython; }
    public String getSolutionJava() { return solutionJava; }
    public void setSolutionJava(String solutionJava) { this.solutionJava = solutionJava; }
    public String getStarterCodeC() { return starterCodeC; }
    public void setStarterCodeC(String starterCodeC) { this.starterCodeC = starterCodeC; }
    public String getStarterCodePython() { return starterCodePython; }
    public void setStarterCodePython(String starterCodePython) { this.starterCodePython = starterCodePython; }
    public String getStarterCodeJava() { return starterCodeJava; }
    public void setStarterCodeJava(String starterCodeJava) { this.starterCodeJava = starterCodeJava; }
    public String getEditorial() { return editorial; }
    public void setEditorial(String editorial) { this.editorial = editorial; }

    public List<TestCase> getTestCasesList() { return testCasesList; }
    public void setTestCasesList(List<TestCase> testCasesList) {
        this.testCasesList.clear();
        if (testCasesList != null) {
            for (TestCase tc : testCasesList) {
                addTestCase(tc);
            }
        }
    }

    public List<ProblemHint> getHintsList() { return hintsList; }
    public void setHintsList(List<ProblemHint> hintsList) {
        this.hintsList.clear();
        if (hintsList != null) {
            for (ProblemHint hint : hintsList) {
                addHint(hint);
            }
        }
    }

    public String getQuestionType() { return questionType != null ? questionType : "CODING"; }
    public void setQuestionType(String questionType) { this.questionType = questionType; }
    public List<String> getOptions() { return options != null ? options : new ArrayList<>(); }
    public void setOptions(List<String> options) {
        this.options = (options != null) ? new ArrayList<>(options) : new ArrayList<>();
    }
    public String getCorrectOption() { return correctOption; }
    public void setCorrectOption(String correctOption) { this.correctOption = correctOption; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public Long getCreatorId() { return creatorId; }
    public void setCreatorId(Long creatorId) { this.creatorId = creatorId; }
    public Boolean getIsPrivate() { return isPrivate != null ? isPrivate : false; }
    public void setIsPrivate(Boolean isPrivate) { this.isPrivate = isPrivate; }

    public String getSolutionCpp() { return solutionCpp; }
    public void setSolutionCpp(String solutionCpp) { this.solutionCpp = solutionCpp; }
    public String getSolutionJs() { return solutionJs; }
    public void setSolutionJs(String solutionJs) { this.solutionJs = solutionJs; }
    public String getSolutionGo() { return solutionGo; }
    public void setSolutionGo(String solutionGo) { this.solutionGo = solutionGo; }
    public String getSolutionRust() { return solutionRust; }
    public void setSolutionRust(String solutionRust) { this.solutionRust = solutionRust; }

    public String getStarterCodeCpp() { return starterCodeCpp; }
    public void setStarterCodeCpp(String starterCodeCpp) { this.starterCodeCpp = starterCodeCpp; }
    public String getStarterCodeJs() { return starterCodeJs; }
    public void setStarterCodeJs(String starterCodeJs) { this.starterCodeJs = starterCodeJs; }
    public String getStarterCodeGo() { return starterCodeGo; }
    public void setStarterCodeGo(String starterCodeGo) { this.starterCodeGo = starterCodeGo; }
    public String getStarterCodeRust() { return starterCodeRust; }
    public void setStarterCodeRust(String starterCodeRust) { this.starterCodeRust = starterCodeRust; }

    public Set<String> getAllowedLanguages() {
        return allowedLanguages != null ? allowedLanguages : new HashSet<>();
    }
    public void setAllowedLanguages(Set<String> allowedLanguages) {
        this.allowedLanguages = (allowedLanguages != null) ? new HashSet<>(allowedLanguages) : new HashSet<>();
    }

    public boolean isLanguageAllowed(String lang) {
        if (lang == null || lang.isBlank()) return false;
        if ("MCQ".equalsIgnoreCase(lang) && "MCQ".equalsIgnoreCase(getQuestionType())) {
            return true;
        }
        if (allowedLanguages == null || allowedLanguages.isEmpty()) {
            // Backward compatibility for existing legacy problems: all languages allowed
            return true;
        }
        String normalized = infosys.onlinecodeplate.model.LanguageRegistry.normalize(lang);
        return allowedLanguages.stream().anyMatch(l -> 
            infosys.onlinecodeplate.model.LanguageRegistry.normalize(l).equalsIgnoreCase(normalized)
        );
    }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
