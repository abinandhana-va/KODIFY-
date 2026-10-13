package infosys.onlinecodeplate.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "contest_problems", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"contest_id", "problem_id"}),
    @UniqueConstraint(columnNames = {"contest_id", "question_order"})
})
public class ContestProblem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contest_id", nullable = false)
    private Contest contest;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "problem_id", nullable = false)
    private Problem problem;

    @Column(name = "question_order", nullable = false)
    private Integer questionOrder = 1;

    @Column(nullable = false)
    private Integer points = 100;

    public ContestProblem() {}

    public ContestProblem(Contest contest, Problem problem, Integer questionOrder, Integer points) {
        this.contest = contest;
        this.problem = problem;
        this.questionOrder = questionOrder != null ? questionOrder : 1;
        this.points = points != null ? points : 100;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Contest getContest() { return contest; }
    public void setContest(Contest contest) { this.contest = contest; }

    public Problem getProblem() { return problem; }
    public void setProblem(Problem problem) { this.problem = problem; }

    public Integer getQuestionOrder() { return questionOrder; }
    public void setQuestionOrder(Integer questionOrder) { this.questionOrder = questionOrder; }

    public Integer getPoints() { return points; }
    public void setPoints(Integer points) { this.points = points; }
}
