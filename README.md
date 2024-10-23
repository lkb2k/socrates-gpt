Single-Page Web App Specification:

Create a single-page web application in that facilitates an interview-like interaction between the user and the OpenAI Chat Completions API. The app will:

1.	Prompt the user for a topic.
2.	Send the topic to OpenAI and ask it to act as an expert interviewer.
3.	Display questions from OpenAI and allow the user to input their answers.
4.	Continue the back-and-forth interaction until the user indicates they’re finished.
5.	Once finished, generate an expert-level article based on the interview conversation.
6.	Provide user-friendly features for markdown rendering and clipboard copying.
7.	Use Tailwind CSS to ensure the app has a modern, professional design.

Key Features:

## Topic Input and Interview Process:
*	User Input: Ask the user to enter a topic to start the interview.
*	OpenAI API Call: Once the topic is submitted, send it to OpenAI’s Chat Completions API with a prompt to act as an expert interviewer.
*	Conversation Continuation: Each time the user provides an answer, send the entire conversation (including all previous questions and answers) to OpenAI, requesting the next question.
*	Submit Methods: Allow the user to submit the topic and answers either by pressing “Enter” or by clicking a ‘Submit’ button.
*	I’m Done Button: The user will have an “I’m Done” button that, when clicked, will send the entire conversation to OpenAI with a new prompt asking it to write an expert-level article based on the topic and interview. The article should be generated in Markdown format.

## Article Generation and Display:
*	Markdown Rendering: The article should be returned in Markdown format. Use the marked library to render it as a formatted HTML article.
*	Copy Markdown Interaction:
*	Provide a button labeled “Copy Markdown” for users to copy the raw Markdown of the article.
*	When the user clicks the button, the Markdown content is copied to the clipboard.
*	Visual Feedback: After the Markdown is successfully copied, display a subtle animated checkmark icon next to the button for confirmation.
*	Animated Message: In addition to the icon, show a brief, animated success message (e.g., “Markdown copied to clipboard!”) that fades out after a short delay to confirm the action.

## API Key Management:
*	API Key Storage: On the user’s first visit, ask them for their OpenAI API key. Store this key in the browser’s local storage for use in subsequent API calls.
*	Clear API Key: Provide an option for the user to clear the stored OpenAI API key, resetting the app to its initial state.

## Mobile-Friendly and Tailwind CSS-based Design:
*	Responsive Layout: Ensure the app is mobile-friendly with large text areas and inputs to accommodate smaller screens.
*	Tailwind CSS Styling: Use Tailwind CSS to create an attractive, professional-looking design with a modern color scheme. This includes:
*	A clean, professional look using Tailwind’s utility classes.
*	Proper padding, margins, and font sizes to improve readability and usability.
*	Color schemes that promote a professional feel and good visual contrast.
*	Consistent styling for buttons, text areas, and inputs to create a cohesive design.
*	Large Inputs: Use large text areas for user answers to improve usability, especially on mobile devices.

## Start Over with a New Topic:
*	Provide a “Start Over” button that resets the entire conversation and lets the user start again by entering a new topic.
*	When clicked, this button should clear the conversation history and allow the user to input a new topic without reloading the page.

## Additional Features:

*	Error Handling: Provide feedback for the user if there are any issues with API calls (e.g., invalid API key, network issues, or API errors).
*	Loading States: Show a loading indicator when waiting for responses from OpenAI.
*	Accessibility: Ensure the app is accessible by using appropriate ARIA attributes and ensuring good contrast and readability.
*	Efficiency, make sure the user can submit the topic or answer with the enter key as well as by hitting the button.  The user can enter a newline by using shift+return

## Key UI Elements:

*	Topic Input: A large input field to enter the topic.
*	Conversation Area: A section that displays the ongoing conversation (questions from OpenAI and answers from the user).
*	Answer Input: A large textarea for users to provide their answers.
*	Submit Button: A button to submit the topic or answer.
*	I’m Done Button: A button to end the interview and generate the article.
*	Markdown Display: A formatted display of the article, with an option to copy the Markdown.
*	Copy Markdown Button: A button for copying the Markdown, with a subtle icon and animated success message indicating successful copying.
*	Start Over Button: A button to reset the conversation and start a new topic.
*	Make sure that all text inputs are textareas with sufficient padding

