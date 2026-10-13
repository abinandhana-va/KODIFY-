import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class DbFix {
    public static void main(String[] args) {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            Connection conn = DriverManager.getConnection("jdbc:mysql://localhost:3306/codingpractice", "root", "root");
            Statement stmt = conn.createStatement();
            try { stmt.execute("ALTER TABLE users ADD COLUMN username VARCHAR(255)"); } catch (Exception e) {}
            try { stmt.execute("UPDATE users SET username=email WHERE username IS NULL"); } catch (Exception e) {}
            try { stmt.execute("ALTER TABLE users MODIFY COLUMN username VARCHAR(255) NOT NULL"); } catch (Exception e) {}
            try { stmt.execute("ALTER TABLE users ADD UNIQUE(username)"); } catch (Exception e) {}
            System.out.println("Done DB fix.");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
