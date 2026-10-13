package infosys.onlinecodeplate.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "assignment_problems", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"assignment_id", "problem_id"})
})
public class AssignmentProblem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", nullable = false)
    private Assignment assignment;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "problem_id", nullable = false)
    private Problem problem;

    private Integer problemOrder = 1;

    private Integer points = 100;

    public AssignmentProblem() {}

    public AssignmentProblem(Assignment assignment, Problem problem, Integer problemOrder, Integer points) {
        this.assignment = assignment;
        this.problem = problem;
        this.problemOrder = problemOrder != null ? problemOrder : 1;
        this.points = points != null ? points : 100;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Assignment getAssignment() { return assignment; }
    public void setAssignment(Assignment assignment) { this.assignment = assignment; }

    public Problem getProblem() { return problem; }
    public void setProblem(Problem problem) { this.problem = problem; }

    public Integer getProblemOrder() { return problemOrder; }
    public void setProblemOrder(Integer problemOrder) { this.problemOrder = problemOrder; }

    public Integer getPoints() { return points; }
    public void setPoints(Integer points) { this.points = points; }
}
