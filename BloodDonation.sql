CREATE DATABASE blooddonation;
USE blooddonation;

-- Users Table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  dob DATE,
  gender VARCHAR(50),
  phone VARCHAR(20),
  bloodGroup VARCHAR(10),
  location VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  password VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Camps Table
CREATE TABLE camps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255),
  date DATE,
  imageUrl VARCHAR(500),
  creatorId INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creatorId) REFERENCES users(id)
);

-- Blood Requests Table
CREATE TABLE blood_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  requesterId INT,
  bloodGroup VARCHAR(10) NOT NULL,
  location VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  urgencyLevel ENUM('Low', 'Medium', 'High') NOT NULL,
  requestStatus ENUM('Pending', 'Completed', 'Cancelled') DEFAULT 'Pending',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (requesterId) REFERENCES users(id)
);

-- Donation Details Table
CREATE TABLE donation_details (
  id INT AUTO_INCREMENT PRIMARY KEY,
  donorId INT,
  bloodGroup VARCHAR(10) NOT NULL,
  donationDate DATE,
  location VARCHAR(255),
  quantity INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (donorId) REFERENCES users(id)
);

-- Constraints Queries
ALTER TABLE users ADD CONSTRAINT unique_phone UNIQUE (phone);
ALTER TABLE users ADD CONSTRAINT chk_blood_group CHECK (bloodGroup IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'));
ALTER TABLE blood_requests MODIFY COLUMN bloodGroup VARCHAR(10) NOT NULL;

-- Set Operations
SELECT id, name, bloodGroup, location FROM users
UNION
SELECT requesterId, 'Requester' AS name, bloodGroup, location FROM blood_requests;

SELECT id, name FROM users
INTERSECT
SELECT donorId, name FROM donation_details;

SELECT id, name FROM users
EXCEPT
SELECT requesterId, name FROM blood_requests;

-- Joins Queries
SELECT users.name, users.bloodGroup, blood_requests.location, blood_requests.urgencyLevel 
FROM users
INNER JOIN blood_requests ON users.id = blood_requests.requesterId;

SELECT users.name, donation_details.bloodGroup, donation_details.donationDate 
FROM users
LEFT JOIN donation_details ON users.id = donation_details.donorId;

SELECT users.name, donation_details.bloodGroup, donation_details.quantity 
FROM users
RIGHT JOIN donation_details ON users.id = donation_details.donorId;

-- Views Queries
CREATE VIEW active_blood_requests AS
SELECT users.name, users.phone, blood_requests.bloodGroup, blood_requests.urgencyLevel 
FROM users
JOIN blood_requests ON users.id = blood_requests.requesterId
WHERE blood_requests.requestStatus = 'Pending';

CREATE VIEW donor_details AS
SELECT users.name, users.bloodGroup, donation_details.donationDate, donation_details.quantity 
FROM users
JOIN donation_details ON users.id = donation_details.donorId;

-- Triggers Queries
DELIMITER //
CREATE TRIGGER update_request_status
AFTER INSERT ON donation_details
FOR EACH ROW
BEGIN
    UPDATE blood_requests 
    SET requestStatus = 'Completed' 
    WHERE bloodGroup = NEW.bloodGroup 
    AND location = NEW.location 
    AND requestStatus = 'Pending' 
    LIMIT 1;
END;
//
DELIMITER ;

DELIMITER //
CREATE TRIGGER prevent_frequent_donation
BEFORE INSERT ON donation_details
FOR EACH ROW
BEGIN
    DECLARE last_donation_date DATE;
    SELECT MAX(donationDate) INTO last_donation_date 
    FROM donation_details 
    WHERE donorId = NEW.donorId;
    
    IF last_donation_date IS NOT NULL AND DATEDIFF(CURDATE(), last_donation_date) < 90 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Donors must wait at least 90 days between donations.';
    END IF;
END;
//
DELIMITER ;

-- Cursors Queries
DELIMITER //
CREATE PROCEDURE get_pending_requests()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE reqId INT;
    DECLARE reqBloodGroup VARCHAR(10);
    DECLARE reqLocation VARCHAR(255);
    DECLARE cur CURSOR FOR 
    SELECT id, bloodGroup, location FROM blood_requests WHERE requestStatus = 'Pending';

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN cur;
    read_loop: LOOP
        FETCH cur INTO reqId, reqBloodGroup, reqLocation;
        IF done THEN
            LEAVE read_loop;
        END IF;
        SELECT CONCAT('Request ID: ', reqId, ', Blood Group: ', reqBloodGroup, ', Location: ', reqLocation) AS RequestDetails;
    END LOOP;
    CLOSE cur;
END;
//
DELIMITER ;