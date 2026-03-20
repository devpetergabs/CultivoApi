ALTER TABLE doctor_chat_sessions
    MODIFY COLUMN conversation_summary LONGTEXT NULL;

ALTER TABLE doctor_chat_messages
    MODIFY COLUMN content LONGTEXT NOT NULL;
