package team.project.redboost.dto;

public class CoachCalendarEventDTO {
    private String id;
    private String type;
    private String title;
    private String date;
    private String startTime;
    private String endTime;
    private String source;

    public CoachCalendarEventDTO() {
    }

    public CoachCalendarEventDTO(String id, String type, String title, String date, String startTime, String endTime, String source) {
        this.id = id;
        this.type = type;
        this.title = title;
        this.date = date;
        this.startTime = startTime;
        this.endTime = endTime;
        this.source = source;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public String getStartTime() {
        return startTime;
    }

    public void setStartTime(String startTime) {
        this.startTime = startTime;
    }

    public String getEndTime() {
        return endTime;
    }

    public void setEndTime(String endTime) {
        this.endTime = endTime;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String id;
        private String type;
        private String title;
        private String date;
        private String startTime;
        private String endTime;
        private String source;

        public Builder id(String id) {
            this.id = id;
            return this;
        }

        public Builder type(String type) {
            this.type = type;
            return this;
        }

        public Builder title(String title) {
            this.title = title;
            return this;
        }

        public Builder date(String date) {
            this.date = date;
            return this;
        }

        public Builder startTime(String startTime) {
            this.startTime = startTime;
            return this;
        }

        public Builder endTime(String endTime) {
            this.endTime = endTime;
            return this;
        }

        public Builder source(String source) {
            this.source = source;
            return this;
        }

        public CoachCalendarEventDTO build() {
            return new CoachCalendarEventDTO(id, type, title, date, startTime, endTime, source);
        }
    }
}
