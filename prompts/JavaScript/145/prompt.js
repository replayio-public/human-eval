/*
  Write a function which sorts the given list of integers
  in ascending order according to the sum of their digits.
  Note: if there are several items with similar sum of their digits,
  order them based on their index in original list.

  For example:
  >>> orderByPoints([1, 11, -1, -11, -12]) == [-1, -11, 1, -12, 11]
  >>> orderByPoints([]) == []
  */
const orderByPoints = (nums) => {
