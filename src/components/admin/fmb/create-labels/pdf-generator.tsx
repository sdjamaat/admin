import React from "react"
import { Button } from "antd"
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  PDFViewer,
  PDFDownloadLink,
} from "@react-pdf/renderer"
import { SingleImportedThaaliSelection } from "../../../../utils/types"
const styles = StyleSheet.create({
  body: {
    width: "8.5in !important",
    height: "11in !important",
    paddingTop: ".5in",
    marginLeft: ".22in",
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
  },
  label: {
    width: "2.6in",
    height: "1in",
    marginRight: ".13in",
    textAlign: "center",
    overflow: "hidden",
    // border: "1px dotted black", // dotted border
    display: "flex",
    flexDirection: "row",
    fontSize: "12px",
  },
  leftColumn: {
    width: "50%", // Set the width to 50% of the label for a 2-column layout
    flexDirection: "column", // Stack items vertically in this column
    justifyContent: "flex-start", // Align items to the start of the column
    alignItems: "flex-start", // Align items to the start of the column
  },
  rightColumn: {
    width: "50%", // Set the width to 50% of the label for the second column
    flexDirection: "column", // Stack items vertically in this column
    justifyContent: "flex-start", // Align items to the start of the column
    paddingLeft: "5px", // Add some padding to separate from the left column
    alignItems: "flex-end", // Right justify the text in this column
    paddingRight: "5px",
  },
  itemName: {
    fontSize: "12px", // Set font size to 14 as requested
    fontWeight: "bold",
    flexWrap: "wrap", // Allow wrapping if the name is too long
    marginBottom: "5px", // Add margin to ensure spacing from the next element
    textAlign: "left",
  },
  codeAndContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: "19px",
    marginBottom: "5px",
  },
  details: {
    marginTop: "5px",
    overflow: "hidden",
    marginBottom: "5px",
  },
})

const getColorForCode = (item: SingleImportedThaaliSelection) => {
  if (item.Code) {
    const codeBeggining = item.Code.split("-")[0]
    switch (codeBeggining) {
      case "SR":
        return "#FF0000" // "red"
      case "ES":
        return "#964B00" //"brown"
      case "4S":
        return "#00FF00" // "green"
      case "UC":
        return "#0000FF" //"blue"
      case "PY":
        return "#FFA500" // "orange"
      case "RB":
        return "#8F00FF" // "violet"
      case "CV":
        return "#FF00FF" // "bright pink"
      case "WW":
        return "#006400" // "dark yellow"
      case "MM":
        return "#00FFFF" // "bright turquoise"
      default:
        return "#000000" // "black"
    }
  } else {
    return "#000000"
  }
}

interface PropsAllLabelsDocument {
  data: SingleImportedThaaliSelection[]
  isBlackAndWhite: boolean
}

const AllLabelsDocument = ({
  data,
  isBlackAndWhite,
}: PropsAllLabelsDocument) => {
  return (
    <Document>
      <Page size="LETTER" style={styles.body}>
        {data.map((item, index) => {
          const color = isBlackAndWhite ? "black" : getColorForCode(item)
          return (
            <View key={index} style={styles.label} wrap={false}>
              <View style={styles.leftColumn}>
                <Text style={styles.codeAndContainer}>
                  {item.ContainerOrCountText || item.Size.charAt(0)}
                </Text>
                <Text style={styles.itemName}>{item.Item}</Text>
              </View>
              <View style={styles.rightColumn}>
                <Text
                  style={{ fontSize: "20px", color: color, fontWeight: "bold" }}
                >
                  {item.Code}
                </Text>
                <Text style={styles.details}>{item.Distribution}</Text>
                <Text style={styles.details}>{item.Family.split(" ")[0]}</Text>
              </View>
            </View>
          )
        })}
      </Page>
    </Document>
  )
}

const LabelPDF = ({ data, isBlackAndWhite }) => {
  return (
    <div style={{ marginTop: "15px" }}>
      <div>
        <PDFDownloadLink
          document={
            <AllLabelsDocument data={data} isBlackAndWhite={isBlackAndWhite} />
          }
          fileName="labels.pdf"
        >
          {({ blob, url, loading, error }) =>
            loading ? (
              "Loading document..."
            ) : (
              <Button type="primary">Download PDF</Button>
            )
          }
        </PDFDownloadLink>
      </div>
      <PDFViewer style={{ height: "100vh", width: "100%", marginTop: "10px" }}>
        <AllLabelsDocument data={data} isBlackAndWhite={isBlackAndWhite} />
      </PDFViewer>
    </div>
  )
}

export default LabelPDF
