package infosys.onlinecodeplate.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "problem_hints")
public class ProblemHint {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "problem_id", nullable = false)
    @JsonIgnore
    private Problem problem;

    @Column(nullable = false)
    private Integer hintOrder;

    @Column(columnDefinition = "LONGTEXT", nullable = false)
    private String content;

    public ProblemHint() {}

    public ProblemHint(Integer hintOrder, String content) {
        this.hintOrder = hintOrder;
        this.content = content;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Problem getProblem() { return problem; }
    public void setProblem(Problem problem) { this.problem = problem; }

    public Integer getHintOrder() { return hintOrder; }
    public void setHintOrder(Integer hintOrder) { this.hintOrder = hintOrder; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}
