// import React from 'react';
// import { Col, Row, Container } from 'react-bootstrap';
// import { CommentView } from 'react-commentview';
// import Themes from 'react-ui-themes-superflows';
// import 'bootstrap/dist/css/bootstrap.min.css';

// export const DiscussionPage = () => {
//   const theme = Themes.getTheme('Default');

//   return (
//     <Container className="mt-5">
//       <Row className="justify-content-center">
//         <Col sm={12} xs={12} md={6} xxl={6}>
//           <CommentView
//             bucket="superflows-myuploads"
//             awsRegion="awsRegion"
//             awsKey="awsKey"
//             awsSecret="awsSecret"
//             awsMediaConvertEndPoint="awsEndpoint"
//             type="video"
//             mode="edit"
//             mediaConvertRole="mediaconvert_role"
//             user={{
//               id: 2,
//               name: 'Hrushi M',
//               picture:
//                 'https://image.shutterstock.com/mosaic_250/2780032/1714666150/stock-photo-head-shot-portrait-close-up-smiling-confident-businessman-wearing-glasses-looking-at-camera-1714666150.jpg',
//               timestamp: '1660215594',
//             }}
//             onSubmit={(result) => {
//               console.log('submit result', result);
//             }}
//             preFill={{
//               text: 'Hello there!',
//               attachment: {
//                 type: 'image',
//                 object: 'myuploads/image_1659529344235.jpeg',
//               },
//             }}
//             theme={theme}
//           />
//         </Col>
//       </Row>
//     </Container>
//   );
// };
