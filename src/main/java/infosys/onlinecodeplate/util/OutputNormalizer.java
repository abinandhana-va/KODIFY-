package infosys.onlinecodeplate.util;

public class OutputNormalizer {

    public static String normalize(String input) {
        if (input == null) return "";
        // Replace Windows line endings \r\n with \n
        String clean = input.replace("\r\n", "\n").replace("\r", "\n");
        // Split into lines and trim trailing spaces per line
        String[] lines = clean.split("\n");
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < lines.length; i++) {
            String trimmedLine = lines[i].replaceAll("\\s+$", "");
            sb.append(trimmedLine);
            if (i < lines.length - 1) {
                sb.append("\n");
            }
        }
        // Overall trim
        return sb.toString().trim();
    }

    public static boolean equalsNormalized(String actual, String expected) {
        return normalize(actual).equals(normalize(expected));
    }
}
