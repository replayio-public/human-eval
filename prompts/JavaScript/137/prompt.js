/*
  Create a function that takes integers, floats, or strings representing
  real numbers, and returns the larger variable in its given variable type.
  Return null if the values are equal.
  Note: If a real number is represented as a string, the floating point might be . or ,

  compareOne(1, 2.5) ➞ 2.5
  compareOne(1, "2,3") ➞ "2,3"
  compareOne("5,1", "6") ➞ "6"
  compareOne("1", 1) ➞ null
  */
const compareOne = (a, b) => {