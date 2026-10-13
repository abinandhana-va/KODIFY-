package infosys.onlinecodeplate.repository;

import infosys.onlinecodeplate.entity.ExamRecording;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamRecordingRepository extends JpaRepository<ExamRecording, Long> {

    List<ExamRecording> findByAttemptId(Long attemptId);

    List<ExamRecording> findByParticipantId(Long participantId);

    List<ExamRecording> findByAssignmentId(Long assignmentId);

    List<ExamRecording> findByAssignmentIdAndParticipantId(Long assignmentId, Long participantId);

    long countByAttemptId(Long attemptId);
}
