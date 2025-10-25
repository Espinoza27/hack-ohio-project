// profile.js
class Profile {
  constructor(name, major, classes = []) {
    this.name = name;        // User's full name
    this.major = major;      // User's major
    this.classes = classes;  // Array of classes like ["ECE 2060", "MATH 2410"]
  }

  // Add a class
  addClass(className) {
    if (!this.classes.includes(className)) {
      this.classes.push(className);
    }
  }

  // Remove a class
  removeClass(className) {
    this.classes = this.classes.filter(c => c !== className);
  }

  // Update user's major
  updateMajor(newMajor) {
    this.major = newMajor;
  }

  // Get profile info
  getProfileInfo() {
    return {
      name: this.name,
      major: this.major,
      classes: this.classes
    };
  }
}

// Example usage:
const userProfile = new Profile('Skyler Williams', 'Computer Engineering', ['ECE 2060', 'MATH 2410']);
userProfile.addClass('ENG 1020');       // Add new class
userProfile.removeClass('MATH 2410');   // Remove a class
console.log(userProfile.getProfileInfo());

/* Output:
{
  name: "Skyler Williams",
  major: "Computer Engineering",
  classes: ["ECE 2060", "ENG 1020"]
}
*/
