/*
  Write a function countNums which takes an array of integers and returns
  the number of elements which has a sum of digits > 0.
  If a number is negative, then its first signed digit will be negative:
  e.g. -123 has signed digits -1, 2, and 3.
  >>> countNums([]) == 0
  >>> countNums([-1, 11, -11]) == 1
  >>> countNums([1, 1, 2]) == 3
  */
const countNums = (arr) => {