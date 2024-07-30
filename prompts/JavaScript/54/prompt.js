/*
  Check if two words have the same characters.
  >>> sameChars('eabcdzzzz', 'dddzzzzzzzddeddabc')
  true
  >>> sameChars('abcd', 'dddddddabc')
  true
  >>> sameChars('dddddddabc', 'abcd')
  true
  >>> sameChars('eabcd', 'dddddddabc')
  false
  >>> sameChars('abcd', 'dddddddabce')
  false
  >>> sameChars('eabcdzzzz', 'dddzzzzzzzddddabc')
  false
  */
const sameChars = (s0, s1) => {
